/* Cut Coach barcode helpers. Requires the locally served ZXingBrowser UMD bundle. */
(function (global) {
  'use strict';

  var OFF_ORIGIN = 'https://world.openfoodfacts.org';
  var OFF_FIELDS = [
    'code', 'product_name', 'brands', 'nutriments', 'serving_size',
    'serving_quantity', 'serving_quantity_unit', 'product_quantity', 'quantity',
    'nutrition_data_per', 'image_front_small_url'
  ].join(',');
  var LOOKUP_TIMEOUT_MS = 12000;

  function error(message, code, cause) {
    var result = new Error(message);
    result.name = code === 'CANCELLED' ? 'AbortError' : 'CutBarcodeError';
    result.code = code;
    if (cause) result.cause = cause;
    return result;
  }

  function cleanCode(code) {
    return typeof code === 'string' ? code.trim() : '';
  }

  function validCode(code) {
    code = cleanCode(code);
    if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return false;
    var sum = 0;
    for (var i = code.length - 2, weight = 3; i >= 0; i -= 1) {
      sum += Number(code.charAt(i)) * weight;
      weight = weight === 3 ? 1 : 3;
    }
    return (10 - (sum % 10)) % 10 === Number(code.charAt(code.length - 1));
  }

  function finiteInRange(value, min, max) {
    if (value === null || value === undefined || typeof value === 'boolean' || (typeof value === 'string' && !value.trim())) return null;
    var number = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(number) && number >= min && number <= max ? number : null;
  }

  function per100Value(nutriments, key, max) {
    return finiteInRange(nutriments && nutriments[key], 0, max);
  }

  function amountAndUnit(value, unit) {
    var amount = finiteInRange(value, 0.001, 100000);
    var normalized = typeof unit === 'string' ? unit.trim().toLowerCase() : '';
    if (amount === null) return null;
    if (normalized === 'g') return { amount: amount, unit: 'g', basis: 'g' };
    if (normalized === 'kg') return { amount: amount * 1000, unit: 'g', basis: 'g' };
    if (normalized === 'ml') return { amount: amount, unit: 'ml', basis: 'ml' };
    if (normalized === 'cl') return { amount: amount * 10, unit: 'ml', basis: 'ml' };
    if (normalized === 'l') return { amount: amount * 1000, unit: 'ml', basis: 'ml' };
    return null;
  }

  function amountFromText(value) {
    if (typeof value !== 'string') return null;
    var match = value.match(/(?:^|[^\d])([0-9]+(?:[.,][0-9]+)?)\s*(kg|g|ml|cl|l)\b/i);
    return match ? amountAndUnit(match[1].replace(',', '.'), match[2]) : null;
  }

  function text(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : '';
  }

  function parseProduct(code, payload) {
    var product = payload && payload.product;
    if (!payload || payload.status !== 1 || !product) throw error('Product not found in Open Food Facts.', 'NOT_FOUND');

    var nutriments = product.nutriments || {};
    var calories = per100Value(nutriments, 'energy-kcal_100g', 2500);
    if (calories === null) {
      var kj = per100Value(nutriments, 'energy-kj_100g', 11000);
      if (kj === null) kj = per100Value(nutriments, 'energy_100g', 11000);
      calories = kj === null ? null : Math.round((kj / 4.184) * 100) / 100;
    }

    // Only explicit mass/volume text determines the display basis. Package quantity
    // is used only as a unit clue; it is never used as a serving amount.
    var serving = amountAndUnit(product.serving_quantity, product.serving_quantity_unit) || amountFromText(product.serving_size);
    var quantity = amountFromText(product.quantity);
    var basis = (serving && serving.basis) || (quantity && quantity.basis) || 'g';
    var servingLabel = text(product.serving_size);
    if (!servingLabel && serving) servingLabel = String(serving.amount) + ' ' + serving.unit;

    return {
      code: text(product.code) || code,
      name: text(product.product_name) || null,
      brand: text(product.brands) || null,
      per100: {
        calories: calories,
        protein: per100Value(nutriments, 'proteins_100g', 100),
        carbs: per100Value(nutriments, 'carbohydrates_100g', 100),
        fat: per100Value(nutriments, 'fat_100g', 100)
      },
      basis: basis,
      servingAmount: serving ? serving.amount : null,
      servingLabel: servingLabel || null,
      sourceUrl: OFF_ORIGIN + '/product/' + encodeURIComponent(code)
    };
  }

  function mergeSignals(externalSignal, timeoutMs) {
    var controller = new AbortController();
    var timeout = global.setTimeout(function () { controller.abort('timeout'); }, timeoutMs);
    var removeExternalListener = function () {};
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort(externalSignal.reason || 'cancelled');
      else {
        var abortExternal = function () { controller.abort(externalSignal.reason || 'cancelled'); };
        externalSignal.addEventListener('abort', abortExternal, { once: true });
        removeExternalListener = function () { externalSignal.removeEventListener('abort', abortExternal); };
      }
    }
    return {
      signal: controller.signal,
      dispose: function () { global.clearTimeout(timeout); removeExternalListener(); },
      timedOut: function () { return controller.signal.aborted && controller.signal.reason === 'timeout'; }
    };
  }

  async function lookup(code, options) {
    code = cleanCode(code);
    if (!validCode(code)) throw error('Enter a valid 8, 12, 13, or 14 digit barcode.', 'INVALID_BARCODE');
    options = options || {};
    if (options.signal && options.signal.aborted) throw error('Barcode lookup was cancelled.', 'CANCELLED');
    if (typeof global.fetch !== 'function') throw error('Barcode lookup is unavailable in this browser.', 'OFFLINE');

    var request = mergeSignals(options.signal, LOOKUP_TIMEOUT_MS);
    var url = OFF_ORIGIN + '/api/v2/product/' + encodeURIComponent(code) + '.json?fields=' + encodeURIComponent(OFF_FIELDS);
    try {
      var response = await global.fetch(url, { method: 'GET', signal: request.signal, headers: { Accept: 'application/json' } });
      if (response.status === 429) throw error('Open Food Facts is rate limiting lookups. Please try again shortly.', 'RATE_LIMITED');
      if (response.status === 404) throw error('Product not found in Open Food Facts.', 'NOT_FOUND');
      if (!response.ok) throw error('Open Food Facts could not complete this lookup (' + response.status + ').', 'OFF_ERROR');
      return parseProduct(code, await response.json());
    } catch (caught) {
      if (caught && caught.code) throw caught;
      if (request.signal.aborted) {
        if (request.timedOut()) throw error('Open Food Facts lookup timed out. Check your connection and try again.', 'TIMEOUT', caught);
        throw error('Barcode lookup was cancelled.', 'CANCELLED', caught);
      }
      if (global.navigator && global.navigator.onLine === false) throw error('You appear to be offline. Connect to look up this barcode.', 'OFFLINE', caught);
      throw error('Could not reach Open Food Facts. Check your connection and try again.', 'OFFLINE', caught);
    } finally {
      request.dispose();
    }
  }

  function zxingReader() {
    if (!global.ZXingBrowser || typeof global.ZXingBrowser.BrowserMultiFormatReader !== 'function') {
      throw error('The bundled barcode scanner is unavailable. Reload the app and try again.', 'SCANNER_UNAVAILABLE');
    }
    return new global.ZXingBrowser.BrowserMultiFormatReader();
  }

  function stopVideo(video) {
    if (!video) return;
    var stream = video.srcObject;
    if (stream && typeof stream.getTracks === 'function') stream.getTracks().forEach(function (track) { track.stop(); });
    try { video.pause(); } catch (_) {}
    try { video.srcObject = null; } catch (_) {}
  }

  function ignorableDecodeError(caught) {
    return caught && /^(NotFoundException|ChecksumException|FormatException)$/.test(caught.name || '');
  }

  async function start(video, onCode, onError) {
    if (!video || typeof video !== 'object') throw error('A video element is required for barcode scanning.', 'INVALID_VIDEO');
    if (typeof onCode !== 'function') throw error('A barcode callback is required.', 'INVALID_CALLBACK');
    var reader;
    var controls;
    var stopped = false;
    var delivered = false;
    var reported = false;
    var stop = function () {
      if (stopped) return;
      stopped = true;
      try { if (controls && typeof controls.stop === 'function') controls.stop(); } catch (_) {}
      try { if (reader && typeof reader.reset === 'function') reader.reset(); } catch (_) {}
      stopVideo(video);
    };
    var fail = function (caught) {
      if (reported) return;
      reported = true;
      stop();
      if (typeof onError === 'function') {
        try { onError(caught); } catch (_) {}
      }
    };
    try {
      reader = zxingReader();
      controls = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        video,
        function (result, caught) {
          if (stopped || delivered) return;
          if (result && typeof result.getText === 'function') {
            var code = cleanCode(result.getText());
            if (!validCode(code)) return;
            delivered = true;
            stop();
            try { onCode(code); } catch (callbackError) { fail(callbackError); }
          } else if (caught && !ignorableDecodeError(caught)) fail(caught);
        }
      );
      if (stopped && controls && typeof controls.stop === 'function') controls.stop();
      return stop;
    } catch (caught) {
      fail(caught);
      throw caught && caught.code ? caught : error('Camera scanning could not start. Check camera permission and try again.', 'CAMERA_FAILED', caught);
    }
  }

  async function decodeImage(file) {
    if (!file || typeof global.URL === 'undefined' || typeof global.URL.createObjectURL !== 'function') {
      throw error('Choose an image file to scan.', 'INVALID_IMAGE');
    }
    var reader = zxingReader();
    var objectUrl = global.URL.createObjectURL(file);
    try {
      var result = await reader.decodeFromImageUrl(objectUrl);
      var code = cleanCode(result && typeof result.getText === 'function' ? result.getText() : '');
      if (!validCode(code)) throw error('No valid UPC, EAN, or GTIN barcode was found in that image.', 'INVALID_BARCODE');
      return code;
    } catch (caught) {
      if (caught && caught.code) throw caught;
      throw error('No readable UPC, EAN, or GTIN barcode was found in that image.', 'IMAGE_DECODE_FAILED', caught);
    } finally {
      try { if (typeof reader.reset === 'function') reader.reset(); } catch (_) {}
      global.URL.revokeObjectURL(objectUrl);
    }
  }

  global.CutBarcode = { validCode: validCode, lookup: lookup, start: start, decodeImage: decodeImage };
}(typeof window !== 'undefined' ? window : globalThis));

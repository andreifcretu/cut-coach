'use strict';

// Pure, local data operations for the optional itemized food ledger. The app
// owns persistence; this module only validates and returns data.
(function (root) {
  const MACROS = ['calories', 'protein', 'carbs', 'fat'];
  const LIMITS = { calories: 20000, protein: 2000, carbs: 3000, fat: 2000 };
  const UNITS = new Set(['g', 'ml', 'serving']);
  const SOURCES = new Set(['manual', 'barcode', 'photo', 'recipe', 'whey', 'repeat']);
  const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
  const CODE_RE = /^[0-9]{1,32}$/;
  const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/;
  const OWN = Object.prototype.hasOwnProperty;

  function fail(message) {
    throw new Error(`FoodLedger: ${message}`);
  }

  function record(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`);
    return value;
  }

  function daysInMonth(year, month) {
    if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
  }

  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));
    return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
  }

  function assertDate(value) {
    if (!validDate(value)) fail('invalid date');
    return value;
  }

  function macroValue(value, key, nullable) {
    if (nullable && value === null) return null;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > LIMITS[key]) {
      fail(`invalid ${key}`);
    }
    return value;
  }

  function cleanBase(value, label = 'base') {
    const source = record(value, label);
    const base = {};
    for (const key of MACROS) {
      if (!OWN.call(source, key)) fail(`${label}.${key} is required`);
      base[key] = macroValue(source[key], key, true);
    }
    return base;
  }

  function validIso8601(value) {
    if (typeof value !== 'string') return false;
    const match = ISO_RE.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6]);
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return false;
    if (hour > 23 || minute > 59 || second > 59) return false;
    if (match[8] !== 'Z') {
      const offsetHour = Number(match[8].slice(1, 3));
      const offsetMinute = Number(match[8].slice(4, 6));
      if (offsetHour > 23 || offsetMinute > 59) return false;
    }
    return Number.isFinite(Date.parse(value));
  }

  function cleanItem(value, label = 'item') {
    const source = record(value, label);
    const required = ['id', 'name', 'amount', 'unit', 'calories', 'protein', 'carbs', 'fat', 'source', 'time', 'createdAt'];
    for (const key of required) if (!OWN.call(source, key)) fail(`${label}.${key} is required`);

    if (typeof source.id !== 'string' || !ID_RE.test(source.id)) fail(`${label}.id is invalid`);
    if (typeof source.name !== 'string') fail(`${label}.name is invalid`);
    const name = source.name.trim();
    if (!name || name.length > 160) fail(`${label}.name is invalid`);
    if (typeof source.amount !== 'number' || !Number.isFinite(source.amount) || source.amount <= 0 || source.amount > 10000) {
      fail(`${label}.amount is invalid`);
    }
    if (typeof source.unit !== 'string' || !UNITS.has(source.unit)) fail(`${label}.unit is invalid`);
    if (typeof source.source !== 'string' || !SOURCES.has(source.source)) fail(`${label}.source is invalid`);
    if (typeof source.time !== 'string' || !TIME_RE.test(source.time)) fail(`${label}.time is invalid`);
    if (!validIso8601(source.createdAt)) fail(`${label}.createdAt is invalid`);

    const item = {
      id: source.id,
      name,
      amount: source.amount,
      unit: source.unit,
      calories: macroValue(source.calories, 'calories', false),
      protein: macroValue(source.protein, 'protein', false),
      carbs: macroValue(source.carbs, 'carbs', false),
      fat: macroValue(source.fat, 'fat', false),
      source: source.source,
      time: source.time,
      createdAt: source.createdAt
    };
    if (OWN.call(source, 'code')) {
      if (typeof source.code !== 'string' || !CODE_RE.test(source.code)) fail(`${label}.code is invalid`);
      item.code = source.code;
    }
    if (OWN.call(source, 'confidenceNote')) {
      if (typeof source.confidenceNote !== 'string' || source.confidenceNote.length > 500) fail(`${label}.confidenceNote is invalid`);
      item.confidenceNote = source.confidenceNote;
    }
    return item;
  }

  function totals(items) {
    if (!Array.isArray(items)) fail('items must be an array');
    const result = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const item of items) {
      record(item, 'item');
      for (const key of MACROS) {
        if (!OWN.call(item, key)) fail(`item.${key} is required`);
        const value = macroValue(item[key], key, false);
        const sum = result[key] + value;
        if (!Number.isFinite(sum) || sum > LIMITS[key]) fail(`daily ${key} limit exceeded`);
        result[key] = sum;
      }
    }
    return result;
  }

  function combinedTotals(base, items) {
    const clean = cleanBase(base);
    if (!items.length) return clean;
    const itemTotals = totals(items);
    const result = {};
    for (const key of MACROS) {
      const sum = itemTotals[key] + (clean[key] ?? 0);
      if (!Number.isFinite(sum) || sum > LIMITS[key]) fail(`daily ${key} limit exceeded`);
      result[key] = sum;
    }
    return result;
  }

  function cleanDiary(input) {
    if (input === undefined) return {};
    const source = record(input, 'foodDiary');
    const diary = {};
    for (const [date, day] of Object.entries(source)) {
      if (!validDate(date)) {
        if (/^\d{4}-/.test(date)) assertDate(date);
        continue;
      }
      assertDate(date);
      const sourceDay = record(day, `foodDiary.${date}`);
      if (!OWN.call(sourceDay, 'base')) fail(`foodDiary.${date}.base is required`);
      if (!OWN.call(sourceDay, 'items') || !Array.isArray(sourceDay.items)) fail(`foodDiary.${date}.items is required`);
      if (sourceDay.items.length > 100) fail(`foodDiary.${date} has too many items`);
      const items = [];
      const ids = new Set();
      for (let index = 0; index < sourceDay.items.length; index += 1) {
        const item = cleanItem(sourceDay.items[index], `foodDiary.${date}.items[${index}]`);
        if (ids.has(item.id)) fail(`foodDiary.${date} has duplicate item id`);
        ids.add(item.id);
        items.push(item);
      }
      const base = cleanBase(sourceDay.base, `foodDiary.${date}.base`);
      combinedTotals(base, items);
      diary[date] = { base, items };
    }
    return diary;
  }

  function cloneState(state) {
    record(state, 'state');
    return structuredClone(state);
  }

  function prepareState(state, date) {
    const next = cloneState(state);
    assertDate(date);
    next.foodDiary = cleanDiary(next.foodDiary);
    if (next.days === undefined) next.days = {};
    if (!next.days || typeof next.days !== 'object' || Array.isArray(next.days)) fail('state.days must be an object');
    return next;
  }

  function dayFor(next, date, create) {
    if (!OWN.call(next.days, date)) {
      if (!create) return undefined;
      next.days[date] = {};
    }
    const day = next.days[date];
    if (!day || typeof day !== 'object' || Array.isArray(day)) fail(`state.days.${date} must be an object`);
    return day;
  }

  function baseFromDay(day) {
    const base = {};
    for (const key of MACROS) {
      const value = day && OWN.call(day, key) && day[key] != null ? day[key] : null;
      base[key] = macroValue(value, key, true);
    }
    return base;
  }

  function targetValue(value, key) {
    return value == null ? null : macroValue(value, key, true);
  }

  function targetSnapshot(state) {
    const settings = state.settings && typeof state.settings === 'object' && !Array.isArray(state.settings) ? state.settings : {};
    return {
      calories: targetValue(settings.calories, 'calories'),
      protein: targetValue(settings.protein, 'protein'),
      carbs: targetValue(settings.carbs, 'carbs'),
      fat: targetValue(settings.fat, 'fat')
    };
  }

  function snapshotTargetIfNeeded(day, state, firstNutritionEntry) {
    if (firstNutritionEntry && !OWN.call(day, 'targets')) day.targets = targetSnapshot(state);
  }

  function writeNutrition(day, values) {
    for (const key of MACROS) day[key] = values[key];
    day.complete = false;
  }

  function legacyBaseline(state, date) {
    const days = state.days;
    if (days === undefined) return { calories: null, protein: null, carbs: null, fat: null };
    if (!days || typeof days !== 'object' || Array.isArray(days)) fail('state.days must be an object');
    const day = OWN.call(days, date) ? days[date] : undefined;
    if (day === undefined) return { calories: null, protein: null, carbs: null, fat: null };
    if (!day || typeof day !== 'object' || Array.isArray(day)) fail(`state.days.${date} must be an object`);
    return baseFromDay(day);
  }

  function items(state, date) {
    assertDate(date);
    record(state, 'state');
    const diary = cleanDiary(state.foodDiary);
    return diary[date] ? structuredClone(diary[date].items) : [];
  }

  function baseline(state, date) {
    assertDate(date);
    record(state, 'state');
    const diary = cleanDiary(state.foodDiary);
    return diary[date] ? structuredClone(diary[date].base) : legacyBaseline(state, date);
  }

  function upsert(state, date, value) {
    const item = cleanItem(value);
    const next = prepareState(state, date);
    const firstNutritionEntry = !OWN.call(next.foodDiary, date);
    const day = dayFor(next, date, true);
    const current = firstNutritionEntry
      ? { base: baseFromDay(day), items: [] }
      : next.foodDiary[date];
    const index = current.items.findIndex(existing => existing.id === item.id);
    if (index < 0 && current.items.length >= 100) fail(`foodDiary.${date} has too many items`);
    const nextItems = current.items.slice();
    if (index < 0) nextItems.push(item);
    else nextItems[index] = item;
    const values = combinedTotals(current.base, nextItems);
    next.foodDiary[date] = { base: structuredClone(current.base), items: nextItems };
    snapshotTargetIfNeeded(day, next, firstNutritionEntry);
    writeNutrition(day, values);
    return next;
  }

  function remove(state, date, id) {
    if (typeof id !== 'string' || !ID_RE.test(id)) fail('id is invalid');
    const next = prepareState(state, date);
    if (!OWN.call(next.foodDiary, date)) return next;
    const current = next.foodDiary[date];
    const index = current.items.findIndex(item => item.id === id);
    if (index < 0) return next;
    const nextItems = current.items.slice();
    nextItems.splice(index, 1);
    const values = combinedTotals(current.base, nextItems);
    const day = dayFor(next, date, true);
    next.foodDiary[date] = { base: structuredClone(current.base), items: nextItems };
    writeNutrition(day, values);
    return next;
  }

  function setBaseline(state, date, value) {
    const base = cleanBase(value, 'macros');
    const next = prepareState(state, date);
    const firstNutritionEntry = !OWN.call(next.foodDiary, date);
    const day = dayFor(next, date, true);
    const currentItems = firstNutritionEntry ? [] : next.foodDiary[date].items.slice();
    const values = combinedTotals(base, currentItems);
    next.foodDiary[date] = { base: structuredClone(base), items: currentItems };
    snapshotTargetIfNeeded(day, next, firstNutritionEntry);
    writeNutrition(day, values);
    return next;
  }

  root.FoodLedger = { clean: cleanDiary, items, totals, baseline, upsert, remove, setBaseline };
})(typeof globalThis === 'object' ? globalThis : this);

'use strict';

const VALID_STATES = new Set(['available', 'unavailable', 'unknown']);

function normalizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.sections || typeof snapshot.sections !== 'object') {
    throw new TypeError('Adapter must return an object with a sections map.');
  }

  const sections = {};
  for (const [sectionId, state] of Object.entries(snapshot.sections)) {
    if (!VALID_STATES.has(state)) {
      throw new TypeError(`Invalid state for ${sectionId}: ${state}`);
    }
    sections[sectionId] = state;
  }

  return {
    source: String(snapshot.source || 'unspecified'),
    checkedAt: snapshot.checkedAt || new Date().toISOString(),
    sections,
  };
}

async function readAvailability(adapter, context = {}) {
  if (!adapter || typeof adapter.readAvailability !== 'function') {
    throw new TypeError('Adapter must implement readAvailability(context).');
  }
  return normalizeSnapshot(await adapter.readAvailability(context));
}

function findNewlyAvailable(previous, current) {
  const before = normalizeSnapshot(previous).sections;
  const after = normalizeSnapshot(current).sections;
  return Object.keys(after).filter((sectionId) =>
    after[sectionId] === 'available' && before[sectionId] !== 'available'
  );
}

class MockTicketAdapter {
  constructor(sections) {
    this.sections = { ...sections };
  }

  async readAvailability() {
    return {
      source: 'local-mock',
      checkedAt: new Date().toISOString(),
      sections: { ...this.sections },
    };
  }
}

module.exports = {
  MockTicketAdapter,
  findNewlyAvailable,
  normalizeSnapshot,
  readAvailability,
};

const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    const copyTests = Array.from(tests);
    return copyTests.sort((testA, testB) => {
      // Force auth.test.ts to run first
      if (testA.path.includes('auth.test')) return -1;
      if (testB.path.includes('auth.test')) return 1;
      
      // Then task.crud.test.ts
      if (testA.path.includes('task.crud.test')) return -1;
      if (testB.path.includes('task.crud.test')) return 1;
      
      // Finally task.permissions.test.ts
      return 0;
    });
  }
}

module.exports = CustomSequencer;
import { calculateSkillProgress } from './progressCalculator';

describe('calculateSkillProgress', () => {
  it('adds a revision bonus and marks progress as improved', () => {
    expect(
      calculateSkillProgress({
        skill: 'organization',
        previousScore: 72,
        rubricDelta: 5,
        revisionCompleted: true,
      }),
    ).toEqual({
      skill: 'organization',
      previousScore: 72,
      currentScore: 80,
      improved: true,
    });
  });

  it('clamps progress between 0 and 100', () => {
    expect(
      calculateSkillProgress({
        skill: 'grammar',
        previousScore: 98,
        rubricDelta: 12,
        revisionCompleted: true,
      }).currentScore,
    ).toBe(100);

    expect(
      calculateSkillProgress({
        skill: 'clarity',
        previousScore: 4,
        rubricDelta: -20,
        revisionCompleted: false,
      }).currentScore,
    ).toBe(0);
  });
});

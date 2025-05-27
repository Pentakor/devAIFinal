/**
 * Test file for pollService (business logic).
 * Includes tests for functions like creating polls, voting, and deleting polls.
 * @module pollService.test
 */

import * as pollService from '../src/service/pollService.js';
import * as pollStorage from '../src/Storage/poll.js';
import * as userService from '../src/service/userService.js';
import * as userStorage from '../src/Storage/user.js';

describe('pollService (business logic)', () => {
  /**
   * Resets the in-memory poll storage before each test.
   * @function
   */
  beforeEach(async () => {
    pollStorage.__resetStorage?.();
    userStorage.__resetStorage?.();
    await userService.createUser('Alice');
    await userService.createUser('Bob');
  });

  /**
   * Test: Creating a poll with valid input.
   * @test
   */
  test('createPoll - creates poll successfully with valid input', async () => {
    const poll = await pollService.createPoll({
      creator: 'Alice',
      question: 'Favorite language?',
      options: ['JavaScript', 'Python']
    });

    expect(poll).toHaveProperty('id');
    expect(poll.creator).toBe('Alice');
    expect(poll.options.length).toBe(2);
    expect(poll.votes).toEqual({});
  });

  /**
   * Test: Fails to create a poll with fewer than 2 options.
   * @test
   */
  test('createPoll - fails if less than 2 options', async () => {
    await expect(
      pollService.createPoll({
        creator: 'Alice',
        question: 'Only one option?',
        options: ['One']
      })
    ).rejects.toThrow('At least two options are required');
  });

  /**
   * Test: Fails to create a poll with duplicate options.
   * @test
   */
  test('createPoll - fails if duplicate options', async () => {
    await expect(
      pollService.createPoll({
        creator: 'Alice',
        question: 'Duplicate?',
        options: ['Same', 'Same']
      })
    ).rejects.toThrow('Duplicate options are not allowed');
  });

  /**
 * Test: Fails when a non-existing user tries to create a poll.
 * @test
 */
  test('createPoll - fails if user does not exist', async () => {
    // Attempt to create a poll with a non-existing user
    await expect(
      pollService.createPoll({
        creator: 'NonExistingUser',
        question: 'Favorite color?',
        options: ['Red', 'Blue']
      })
    ).rejects.toThrow('Creator does not exist');
  });

  /**
   * Test: Returns all polls.
   * @test
   */
  test('getPolls - returns all polls', async () => {

    await pollService.createPoll({
      creator: 'Alice',
      question: 'Question 1?',
      options: ['A', 'B']
    });
    await pollService.createPoll({
      creator: 'Bob',
      question: 'Question 2?',
      options: ['X', 'Y']
    });

    const polls = await pollService.getPolls();
    expect(polls.length).toBe(2);
  });

  /**
   * Test: Returns only polls created by a specific user.
   * @test
   */
  test('getPollsByUser - filters polls by creator', async () => {
    await pollService.createPoll({
      creator: 'Alice',
      question: 'Q1',
      options: ['1', '2']
    });
    await pollService.createPoll({
      creator: 'Bob',
      question: 'Q2',
      options: ['A', 'B']
    });

    const alicePolls = await pollService.getPollsByUser('Alice');
    expect(alicePolls.length).toBe(1);
    expect(alicePolls[0].creator).toBe('Alice');
  });

  /**
   * Test: Fails to get polls when the username is invalid.
   * @test
   */
  test('getPollsByUser - fails with invalid username', async () => {
    await expect(pollService.getPollsByUser(null)).rejects.toThrow();
  });

  /**
   * Test: Success when the creator deletes a poll.
   * @test
   */
  test('deletePoll - success if called by creator', async () => {
    const poll = await pollService.createPoll({
      creator: 'Alice',
      question: 'Delete me?',
      options: ['Yes', 'No']
    });

    await expect(pollService.deletePoll(poll.id, 'Alice')).resolves.toBeUndefined();
  });

  /**
   * Test: Fails to delete a poll if the caller is not the creator.
   * @test
   */
  test('deletePoll - fails if called by non-creator', async () => {
    const poll = await pollService.createPoll({
      creator: 'Alice',
      question: 'Delete me?',
      options: ['Yes', 'No']
    });

    await expect(pollService.deletePoll(poll.id, 'Bob')).rejects.toThrow('You are not authorized to delete this poll');
  });

  /**
   * Test: Fails to delete a poll that does not exist.
   * @test
   */
  test('deletePoll - fails if poll not found', async () => {
    await expect(pollService.deletePoll('non-existent-id', 'Someone')).rejects.toThrow('Poll not found');
  });
});

/**
 * Test file for userService (business logic).
 * Includes tests for functions like creating users, voting, and get voted polls.
 * @module userService.test
 */

import * as userService from '../src/service/userService.js';
import * as pollService from '../src/service/pollService.js';
import * as userStorage from '../src/Storage/user.js';
import * as pollStorage from '../src/Storage/poll.js';

describe('userService (business logic)', () => {
  /**
   * Clears the in-memory user and poll store before each test.
   * @function
   */
  beforeEach(async () => {
    userStorage.__resetStorage?.();
    pollStorage.__resetStorage?.();
  });

  /**
   * Test: Creates a new user successfully.
   * @test
   */
  test('createUser - creates new user', async () => {
    await userService.createUser('John Weiss');
    const user = await userService.getUser('John Weiss');
    expect(user).toBe('John Weiss');
  });

  /**
   * Test: Fails to create a user with a duplicate username.
   * @test
   */
  test('createUser - fails with duplicate username', async () => {
    await userService.createUser('John Weiss');
    await expect(userService.createUser('John Weiss')).rejects.toThrow('User already exists');
  });

  /**
   * Test: User can vote successfully on a poll they created.
   * @test
   */
  test('vote - succeeds for existing user on existing poll', async () => {
    await userService.createUser('Sapir');
    const poll = await pollService.createPoll({
      creator: 'Sapir',
      question: 'Best front-end framework?',
      options: ['React', 'Vue']
    });

    const result = await userService.voteOnPoll(poll.id, 'Sapir', 0);
    expect(result.votes['Sapir']).toBe(0);
  });

  /**
    * Test: User can vote successfully on a poll created by another user.
   * @test
   */
  test('vote - user votes successfully', async () => {
    await userService.createUser('Alice');
    const poll = await pollService.createPoll({
      creator: 'Alice',
      question: 'Pick a fruit',
      options: ['Apple', 'Banana']
    });

    await userService.createUser('Bob');
    const result = await userService.voteOnPoll(poll.id, 'Bob', 0);

    expect(result.votes['Bob']).toBe(0);
  });

  /**
   * Test: Fails to vote for a non-existing user.
   * @test
   */
  test('vote - fails for non-existing user', async () => {
    await userService.createUser('Alice');
    const poll = await pollService.createPoll({
      creator: 'Alice',
      question: 'Favorite color?',
      options: ['Red', 'Blue']
    });

    await expect(
      userService.voteOnPoll(poll.id, 'GhostUser', 1)
    ).rejects.toThrow("User does not exist");
  });

  /**
   * Test: Fails to vote on a non-existing poll.
   * @test
   */
  test('vote - fails for non-existing poll', async () => {
    await userService.createUser('Dana');

    await expect(
      userService.voteOnPoll('non-existing-id', 'Dana', 0)
    ).rejects.toThrow('Poll not found');
  });

  /**
   * Test: Fails to vote when an invalid option index is provided.
   * @test
   */
  test('vote - fails for invalid option index', async () => {
    await userService.createUser('Eli');
    const poll = await pollService.createPoll({
      creator: 'Eli',
      question: 'Choose one',
      options: ['One', 'Two']
    });

    await expect(
      userService.voteOnPoll(poll.id, 'Eli', 5)
    ).rejects.toThrow('Invalid option index');
  });

  /**
   * Test: Fails if the same user tries to vote twice.
   * @test
   */
  test('vote - fails on duplicate vote by same user', async () => {
    await userService.createUser('Tomer');
    const poll = await pollService.createPoll({
      creator: 'Tomer',
      question: 'Coffee or Tea?',
      options: ['Coffee', 'Tea']
    });

    await userService.voteOnPoll(poll.id, 'Tomer', 1);

    await expect(
      userService.voteOnPoll(poll.id, 'Tomer', 0)
    ).rejects.toThrow('User has already voted');
  });

  /**
   * Test: Fails when trying to vote on a poll after it has been deleted.
   * @test
   */
  test('vote - fails if poll is deleted', async () => {
    await userService.createUser('Bob');
    await userService.createUser('Alice');
    const poll = await pollService.createPoll({
      creator: 'Alice',
      question: 'Choose your fruit',
      options: ['Apple', 'Banana']
    });
    const pollId = poll.id;

    await pollService.deletePoll(pollId, 'Alice');

    await expect(
      userService.voteOnPoll(pollId, 'Bob', 0)
    ).rejects.toThrow('Poll not found');
  });

  /**
   * Test: Get all the polls that a user has voted for.
   * @test
   */
  test('get voted-by/:username - returns correct polls', async () => {
    await userService.createUser('Lea');
    const poll1 = await pollService.createPoll({
      creator: 'Lea',
      question: 'Choose fruit',
      options: ['Apple', 'Banana']
    });
    const poll2 = await pollService.createPoll({
      creator: 'Lea',
      question: 'Choose color',
      options: ['Red', 'Green']
    });

    await userService.voteOnPoll(poll1.id, 'Lea', 0);
    await userService.voteOnPoll(poll2.id, 'Lea', 1);

    const votedPolls = await userService.getVotedPollsByUser('Lea');
    expect(votedPolls.length).toBe(2);
    expect(votedPolls.map(p => p.id)).toEqual(expect.arrayContaining([poll1.id, poll2.id]));
  });
});



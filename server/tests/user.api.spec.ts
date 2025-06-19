import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import supertest, { type Response } from 'supertest';
import { app } from '../src/app.ts';

let response: Response;
const auth1 = { username: 'user1', password: 'pwd1' };
const user1 = { username: 'user1', display: 'Yāo' };
const auth2 = { username: 'user2', password: 'pwd2' };
const user2 = { username: 'user2', display: 'Sénior Dos' };

describe('GET /api/user/:id', () => {
  it('should 404 for nonexistent users', async () => {
    response = await supertest(app).get(`/api/user/${randomUUID().toString()}`);
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: 'User not found' });
  });

  it('should return existing users', async () => {
    response = await supertest(app).get(`/api/user/user1`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      createdAt: expect.anything(),
      bio: '',
      image_url: '',
      preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
      stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
    });

    response = await supertest(app).get(`/api/user/user2`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user2,
      createdAt: expect.anything(),
      bio: '',
      image_url: '',
      preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
      stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
    });
  });
});

describe('POST /api/user/login', () => {
  it('should return 400 on ill-formed payload', async () => {
    response = await supertest(app)
      .post('/api/user/login')
      .send({ ...auth1, password: 3 });
    expect(response.status).toBe(400);
  });

  it('should return the same response if user does not exist or if user exists and password is wrong', async () => {
    const expectedResponse = { error: 'Invalid username or password' };

    // Incorrect password for existing user
    response = await supertest(app)
      .post('/api/user/login')
      .send({ ...auth1, password: 'no' });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(expectedResponse);

    // Nonexistent username
    response = await supertest(app)
      .post('/api/user/login')
      .send({ ...auth1, username: randomUUID().toString() });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(expectedResponse);
  });

  it('should accept a correct username/password combination', async () => {
    response = await supertest(app).post('/api/user/login').send(auth1);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      createdAt: expect.anything(),
      bio: '',
      image_url: '',
      preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
      stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
    });
  });
});

describe('POST/api/user/:username', () => {
  it('should return 400 on ill-formed payloads', async () => {
    response = await supertest(app).post('/api/user/user1').send({ auth: auth1, payload: 4 });
    expect(response.status).toBe(400);
  });

  it('should reject invalid authorization', async () => {
    response = await supertest(app)
      .post('/api/user/user1')
      .send({ auth: { ...auth1, password: 'wrong' }, payload: { display: 'New User 1 Display?' } });
    expect(response.status).toBe(403);
  });

  it('requires the authorization to match the route', async () => {
    response = await supertest(app)
      .post('/api/user/user1')
      .send({ auth: auth2, payload: { display: 'New User 1 Display!' } });
    expect(response.status).toBe(403);
  });

  it('should update individual parts of a user correctly', async () => {
    // Change the username
    response = await supertest(app)
      .post('/api/user/user1')
      .send({ auth: auth1, payload: { display: 'New User 1 Display' } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      display: 'New User 1 Display',
      createdAt: expect.anything(),
      bio: '',
      image_url: '',
      preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
      stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
    });

    // We have changed the username, which should be reflected
    response = await supertest(app)
      .post('/api/user/user1')
      .send({ auth: auth1, payload: { display: 'New User 1 Display' } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      display: 'New User 1 Display',
      createdAt: expect.anything(),
      bio: '',
      image_url: '',
      preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
      stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
    });

    // Change to dark mode
    response = await supertest(app)
      .post('/api/user/user1')
      .send({ auth: auth1, payload: { preferences: { theme: 'dark' } } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      display: 'New User 1 Display',
      createdAt: expect.anything(),
      bio: '',
      image_url: '',
      preferences: { colorblind: 'none', theme: 'dark', fontSize: 'M', fontFamily: 'default' },
      stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
    });

    // Change colorblind
    response = await supertest(app)
      .post('/api/user/user1')
      .send({ auth: auth1, payload: { preferences: { colorblind: 'protanopia', theme: 'dark' } } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      display: 'New User 1 Display',
      createdAt: expect.anything(),
      bio: '',
      image_url: '',
      preferences: {
        colorblind: 'protanopia',
        theme: 'dark',
        fontSize: 'M',
        fontFamily: 'default',
      },
      stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
    });

    // Change text size
    response = await supertest(app)
      .post('/api/user/user1')
      .send({
        auth: auth1,
        payload: { preferences: { fontSize: 'L', colorblind: 'protanopia', theme: 'dark' } },
      });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      display: 'New User 1 Display',
      createdAt: expect.anything(),
      bio: '',
      image_url: '',
      preferences: {
        colorblind: 'protanopia',
        theme: 'dark',
        fontSize: 'L',
        fontFamily: 'default',
      },
      stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
    });

    // Change bio
    response = await supertest(app)
      .post('/api/user/user1')
      .send({
        auth: auth1,
        payload: { bio: 'New User 1 Bio' },
      });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      display: 'New User 1 Display',
      createdAt: expect.anything(),
      bio: 'New User 1 Bio',
      image_url: '',
      preferences: {
        colorblind: 'protanopia',
        theme: 'dark',
        fontSize: 'L',
        fontFamily: 'default',
      },
      stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
    });

    // Change the password
    response = await supertest(app)
      .post('/api/user/user1')
      .send({
        auth: auth1,
        payload: {
          password: 'new_password_1',
          preferences: { fontSize: 'L', colorblind: 'protanopia', theme: 'dark' },
        },
      });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      display: 'New User 1 Display',
      createdAt: expect.anything(),
      bio: 'New User 1 Bio',
      image_url: '',
      preferences: {
        colorblind: 'protanopia',
        theme: 'dark',
        fontSize: 'L',
        fontFamily: 'default',
      },
      stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
    });

    // We have changed the password, so auth shouldn't work
    response = await supertest(app)
      .post('/api/user/user1')
      .send({ auth: auth1, payload: { password: 'new_password_1' } });
    expect(response.status).toBe(403);

    // But the new password should allow changes
    response = await supertest(app)
      .post('/api/user/user1')
      .send({
        auth: { ...auth1, password: 'new_password_1' },
        payload: { display: 'Newer User 1 Display' },
      });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      ...user1,
      display: 'Newer User 1 Display',
      createdAt: expect.anything(),
      bio: 'New User 1 Bio',
      image_url: '',
      preferences: {
        colorblind: 'protanopia',
        theme: 'dark',
        fontSize: 'L',
        fontFamily: 'default',
      },
      stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
    });
  });
});

describe('POST /api/user/signup', () => {
  const password = 'pwd';

  it('should create a user given valid arguments', async () => {
    const username = randomUUID().toString();
    response = await supertest(app).post('/api/user/signup').send({ username, password });
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application.json/);
    expect(response.body).toStrictEqual({
      username,
      display: username,
      createdAt: expect.anything(),
      bio: '',
      image_url: '',
      preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
      stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
    });
  });

  it('should return 400 on ill-formed payload', async () => {
    const username = randomUUID().toString();
    response = await supertest(app).post('/api/user/signup').send({ username });
    expect(response.status).toBe(400);
  });

  it('should return error if trying to make an existing user', async () => {
    const username = randomUUID().toString();
    response = await supertest(app).post('/api/user/signup').send({ username, password });
    expect(response.status).toBe(200);
    response = await supertest(app).post('/api/user/signup').send({ username, password });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ error: 'User already exists' });
  });

  it('should not allow a username that conflicts with created paths', async () => {
    const expectedResponse = { error: 'That is not a permitted username' };

    response = await supertest(app).post('/api/user/signup').send({ username: 'signup', password });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(expectedResponse);

    response = await supertest(app).post('/api/user/signup').send({ username: 'login', password });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(expectedResponse);
  });
});

describe('POST /api/user/list', () => {
  it('should return 400 on ill-formed payload', async () => {
    response = await supertest(app).post('/api/user/list').send(auth1);
    expect(response.status).toBe(400);
  });

  it('should indicate an error if usernames do not exist', async () => {
    response = await supertest(app).post('/api/user/list').send(['user1', randomUUID().toString()]);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ error: 'Usernames do not all exist' });
  });

  it('accepts the empty list', async () => {
    response = await supertest(app).post('/api/user/list').send([]);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([]);
  });

  it('accepts valid usernames and returns appropriate responses', async () => {
    response = await supertest(app).post('/api/user/list').send(['user2', 'user1']);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        ...user2,
        createdAt: expect.anything(),
        bio: '',
        image_url: '',
        preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
        stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
      },
      {
        ...user1,
        createdAt: expect.anything(),
        bio: '',
        image_url: '',
        preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
        stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
      },
    ]);
  });

  it('accepts duplicates and returns users in the order provided', async () => {
    response = await supertest(app).post('/api/user/list').send(['user1', 'user2', 'user1']);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([
      {
        ...user1,
        createdAt: expect.anything(),
        bio: '',
        image_url: '',
        preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
        stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
      },
      {
        ...user2,
        createdAt: expect.anything(),
        bio: '',
        image_url: '',
        preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
        stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
      },
      {
        ...user1,
        createdAt: expect.anything(),
        bio: '',
        image_url: '',
        preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
        stats: { gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: 0 },
      },
    ]);
  });

  describe('GET /api/user/:username/stats', () => {
    it('should return 404 for nonexistent users', async () => {
      response = await supertest(app).get(`/api/user/${randomUUID().toString()}/stats`);
      expect(response.status).toBe(404);
      expect(response.body).toStrictEqual({ error: 'User not found' });
    });

    it('should return default stats for new users', async () => {
      response = await supertest(app).get('/api/user/user1/stats');
      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        winRate: 0,
      });
    });
  });

  describe('POST /api/user/stats', () => {
    it('should return 400 on ill-formed payload', async () => {
      response = await supertest(app).post('/api/user/stats').send({ auth: auth1 }); // Missing payload
      expect(response.status).toBe(400);
    });

    it('should reject invalid authorization', async () => {
      response = await supertest(app)
        .post('/api/user/stats')
        .send({
          auth: { ...auth1, password: 'wrong' },
          payload: { result: 'win' },
        });
      expect(response.status).toBe(403);
    });

    it('should update stats for a win', async () => {
      const username = randomUUID().toString();
      const password = 'testpwd';

      await supertest(app).post('/api/user/signup').send({ username, password });
      response = await supertest(app)
        .post('/api/user/stats')
        .send({
          auth: { username, password },
          payload: { result: 'win' },
        });
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        username,
        stats: {
          gamesPlayed: 1,
          gamesWon: 1,
          gamesLost: 0,
          winRate: 1,
        },
      });
      response = await supertest(app).get(`/api/user/${username}/stats`);
      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({
        gamesPlayed: 1,
        gamesWon: 1,
        gamesLost: 0,
        winRate: 1,
      });
    });

    it('should update stats for a loss', async () => {
      const username = randomUUID().toString();
      const password = 'testpwd';

      await supertest(app).post('/api/user/signup').send({ username, password });
      response = await supertest(app)
        .post('/api/user/stats')
        .send({
          auth: { username, password },
          payload: { result: 'loss' },
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        username,
        stats: {
          gamesPlayed: 1,
          gamesWon: 0,
          gamesLost: 1,
          winRate: 0,
        },
      });
    });

    it('should accumulate stats correctly', async () => {
      const username = randomUUID().toString();
      const password = 'testpwd';

      await supertest(app).post('/api/user/signup').send({ username, password });
      await supertest(app)
        .post('/api/user/stats')
        .send({
          auth: { username, password },
          payload: { result: 'win' },
        });

      await supertest(app)
        .post('/api/user/stats')
        .send({
          auth: { username, password },
          payload: { result: 'loss' },
        });

      response = await supertest(app)
        .post('/api/user/stats')
        .send({
          auth: { username, password },
          payload: { result: 'win' },
        });
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        username,
        stats: {
          gamesPlayed: 3,
          gamesWon: 2,
          gamesLost: 1,
          winRate: 2 / 3,
        },
      });
    });
  });
});

describe('Leaderboard and Profile Stats API', () => {
  it('should return 404 for nonexistent user stats', async () => {
    const response = await supertest(app).get('/api/user/nonexistentuser/stats');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('should return default stats for an existing user', async () => {
    const response = await supertest(app).get(`/api/user/${user1.username}/stats`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      winRate: 0,
    });
  });

  it('should update stats for a win and a loss', async () => {
    await supertest(app)
      .post('/api/user/stats')
      .send({
        auth: auth1,
        payload: { result: 'win' },
      });
    await supertest(app)
      .post('/api/user/stats')
      .send({
        auth: auth1,
        payload: { result: 'loss' },
      });
    const response = await supertest(app).get(`/api/user/${user1.username}/stats`);
    expect(response.body).toEqual({
      gamesPlayed: 2,
      gamesWon: 1,
      gamesLost: 1,
      winRate: 0.5,
    });
  });

  it('should return all users sorted by win rate on leaderboard', async () => {
    // Give user1 2 wins, user2 1 win, 1 loss
    await supertest(app)
      .post('/api/user/stats')
      .send({ auth: auth1, payload: { result: 'win' } });
    await supertest(app)
      .post('/api/user/stats')
      .send({ auth: auth1, payload: { result: 'win' } });
    await supertest(app)
      .post('/api/user/stats')
      .send({ auth: auth2, payload: { result: 'win' } });
    await supertest(app)
      .post('/api/user/stats')
      .send({ auth: auth2, payload: { result: 'loss' } });

    const response = await supertest(app).get('/api/user/leaderboard');
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
    // user1 should be first (winRate 1), user2 second (winRate 0.5)
    expect(response.body[0].username).toBe(user1.username);
    expect(response.body[1].username).toBe(user2.username);
  });
});

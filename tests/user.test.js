const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneId, userOne, setupDatabase, closeDatabaseConnection } = require('./fixtures/db')

beforeEach( async () => {
    await setupDatabase()    
})

afterAll( async () => {
    closeDatabaseConnection()
})

test('New user signup', async () => {
    const response = await request(app).post('/users').send({
        name: 'Shivam',
        email: 'shivam@example.com',
        password: 'MyPass123!'
    }).expect(201)

    //Assert that Database was changed
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    //Assertions for response
    expect(response.body).toMatchObject({
        user:{
            name: 'Shivam',
            email: 'shivam@example.com',
        },
        token: user.tokens[0].token
    })
})

test('Existing user login', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(response.body.user._id)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('User logging in with invalid credentials', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: 'wrongpass'
    }).expect(400)
})

test('Logged in user should get profile information', async () => {
    await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Non Logged in user shouldn not get profile information', async () => {
    await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Unauthenticated user trying to delete an account', async () => {
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('Authenticated user deleting an account', async () => {
    const response = await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    const user = await User.findById(response.body._id)
    expect(user).toBeNull()
    expect(response.body._id).toBe(userOneId.toString())
})

test('Upload avatar', async() => {
    await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/response.jpg')
    .expect(200)

    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Update user data', async() => {
    const newName = 'Ross'
    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        name: newName
    })
    .expect(200)

    const user = await User.findById(userOneId)
    expect(user.name).toBe(newName)
})

test('Should not update invalid user data', async() => {
    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
        location: 'Philadelphia'
    })
    .expect(400)
})


// User Test Ideas
//
// Should not signup user with invalid name/email/password
// Should not update user if unauthenticated
// Should not update user with invalid name/email/password
// Should not delete user if unauthenticated

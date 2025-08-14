const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const User = require('../src/models/User');
require('dotenv').config();

let token = null;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    // Create a test user and get a token
    const testUser = new User({ username: 'testuser', password: 'password123' });
    await testUser.save();

    const response = await request(app)
        .post('/api/users/login')
        .send({ username: 'testuser', password: 'password123' });

    token = response.body.token;
});

afterAll(async () => {
    // Clean up database after tests
    await Product.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
});

describe('Product API Endpoints', () => {

    it('should create a new product', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Test Product',
                description: 'Test Description',
                price: 20,
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body.name).toEqual('Test Product');
    });

    it('should get all products', async () => {
        const res = await request(app).get('/api/products');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should get a product by id', async () => {
        const product = new Product({
            name: 'Product to Get',
            description: 'Description to Get',
            price: 30,
        });
        await product.save();

        const res = await request(app).get(`/api/products/${product._id}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('Product to Get');
    });

    it('should update a product', async () => {
        const product = new Product({
            name: 'Product to Update',
            description: 'Description to Update',
            price: 40,
        });
        await product.save();

        const res = await request(app)
            .patch(`/api/products/${product._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Updated Product',
                price: 50,
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('Updated Product');
        expect(res.body.price).toEqual(50);
    });

    it('should delete a product', async () => {
        const product = new Product({
            name: 'Product to Delete',
            description: 'Description to Delete',
            price: 60,
        });
        await product.save();

        const res = await request(app)
            .delete(`/api/products/${product._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Deleted Product');

        const checkProduct = await Product.findById(product._id);
        expect(checkProduct).toBeNull();
    });
});
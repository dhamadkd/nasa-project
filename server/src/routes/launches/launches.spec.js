const request = require('supertest');
const app = require('../../app');

const {mongoConnect, mongoDisconnect} = require("../../services/mongo");

const {loadPlantesData} = require("../../models/planets.model");

describe('Test Launch APIs', ()=> {

    beforeAll(async ()=> {
        await mongoConnect();
        await loadPlantesData();
    });

    afterAll(async ()=>{
        await mongoDisconnect();
    })
    describe('Test /GET launches api ', ()=> {
        test('It should return status 200 success', async () => {
            const response = await request(app)
            .get('/v1/launches')
            .expect('Content-Type', /json/)
            .expect(200);
            // expect(response.statusCode).toBe(200);
        })
    })
    
    describe('Test /POST launch api', () => {
        const completeLaunchData = {
            mission: "USS Enterprise",
            rocket: 'NCC 1701-D',
            target: "Kepler-62 f",
            launchDate: 'January 4, 2028'
        }
        const launcDataWihtoutDate = {
            mission: "USS Enterprise",
            rocket: 'NCC 1701-D',
            target: "Kepler-62 f"
        }
    
        const launchDataWithInvalidDate = {
            mission: "USS Enterprise",
            rocket: 'NCC 1701-D',
            target: "Kepler-62 f",
            launchDate: 'zoot'
        }
        test('It should return status 201 success', async ()=> {
            const response = await request(app)
            .post('/v1/launches')
            .send(completeLaunchData)
            .expect('Content-Type', /json/)
            .expect(201);
    
            const requestDate = new Date(completeLaunchData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();
            expect(requestDate).toBe(responseDate);
    
            expect(response.body).toMatchObject(launcDataWihtoutDate);
        })
        test('It should catch missing required parameters', async ()=> {
            const response = await request(app)
            .post('/v1/launches')
            .send(launcDataWihtoutDate)
            .expect('Content-Type', /json/)
            .expect(400);
    
            expect(response.body).toStrictEqual(
                {
                    error : "Missing required launch property"
                }
            )
        })
        test('It should catch invalid dates', async ()=> {
            const response = await request(app)
            .post('/v1/launches')
            .send(launchDataWithInvalidDate)
            .expect('Content-Type', /json/)
            .expect(400);
    
            expect(response.body).toStrictEqual(
                {
                    error: "Invalid launchDate"
                }
            )
        })
    })
})
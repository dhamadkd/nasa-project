const axios = require('axios');

const launchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo');

const launches = new Map();

const  DEFAULT_FLIGHT_NUM = 100;

const launch = {
    flightNumber: 100, // flight_number
    mission: 'Kepler Exploration X', //name
    rocket: 'Explorer IS1', //rocket.name
    launchDate: new Date('December 27, 2030'), //date_local
    target: 'Kepler-442 b', // not applicable
    customers: ['ZTM', 'NASA'], //payloads.customers
    upcoming: true, //upcoming
    success: true //success
}

saveLaunch(launch);

launches.set(launch.flightNumber, launch);

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query'

async function populateLaunches(){
    console.log('Loading Launches Data...',
    );
    const response = await axios.post(SPACEX_API_URL,
        {
            query: {},
            options: {
                pagination:false,
                populate: [
                    {
                        path: 'rocket',
                        select:{
                            'name': 1
                        }
                    },
                    {
                        path: 'payloads',
                        select:{
                            customers: 1
                        }
                    }
                ]
            }
        }
    )

    if(response.status !== 200){
        console.log('There is a problem downloading launch data');
        throw new Error('Kaunch data download failed');
    }

    const launchDocs = response.data.docs;

    for(const launchDoc of launchDocs){
        const payloads =  launchDoc["payloads"];
        const customers = payloads.flatMap((payload)=>{
            return payload["customers"];
        })

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            customers: customers,
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success']
        }

        console.log(`Flight Number ${launch.flightNumber}, Mission ${launch.mission}`);
        await saveLaunch(launch);
    }
}

async function loadLaunchData(){
   const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat'
   })
   if(firstLaunch){
    console.log('Launches already exist');
   }else{
    await populateLaunches();
   }
}

async function findLaunch(filter){
    return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId){
    console.log(launchId);
   return await findLaunch({
    flightNumber: launchId
   });
}

async function getAllLaunches(skip, limit){
    return await launchesDatabase.find({}, {'__v':0,'_id':0})
    .sort({flightNumber:1})
    .skip(skip)
    .limit(limit);
}

async function getLatestFlightNumber(){
    const latestNumber = await launchesDatabase.
        findOne({},{'__v':0,'_id':0}).
        sort('-flightNumber');
    if(!latestNumber){
        return DEFAULT_FLIGHT_NUM;
    }
    return latestNumber.flightNumber;
}

async function saveLaunch(launch){
    await launchesDatabase.findOneAndUpdate(
        {flightNumber: launch.flightNumber},
        launch,
        {upsert:true}
    )
}

// function addNewLaunch(launch){
//     latestFlightNumber++
//     launches.set(
//         latestFlightNumber,
//         Object.assign(
//             launch,
//             {
//                 flightNumber: latestFlightNumber,
//                 customers: ['ZTM', 'NASA'],
//                 upcoming: true,
//                 success: true
//             })
//     )
// }

async function scheduleNewLaunch(launch){
    const planet = await planets.findOne({
        'keplerName': launch.target
    })
    if(!planet){
        throw new Error('No matching target in planets')
    }
    const newFlightNumber = await getLatestFlightNumber() + 1;
    const newLaunch = 
        Object.assign(
            launch,
            {
            upcoming: true,
            success: true,
            customers: ['ZTM', 'NASA'],
            flightNumber : newFlightNumber
        });
        console.log(newLaunch);
    await saveLaunch(newLaunch);
} 

async function abortByLaunchId(launchId){
    const aborted = await launchesDatabase.updateOne(
        {
            flightNumber: launchId
        },
        {
            success: false,
            upcoming: false
        }
    )
    console.log(aborted);
    return aborted.modifiedCount === 1;
}

module.exports = {
    loadLaunchData,
    getAllLaunches,
    scheduleNewLaunch,
    existsLaunchWithId,
    abortByLaunchId
}
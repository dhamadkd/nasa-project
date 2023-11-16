const fs = require('fs');
const path = require('path');
const {parse} = require('csv-parse');

const planets = require('./planets.mongo');

// const habitablePlanets = [];

function isHabitablePlanet(planet) {
  return planet['koi_disposition'] === 'CONFIRMED'
    && planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11
    && planet['koi_prad'] < 1.6;
}

function loadPlanetsData () {
return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname,'..','..','data','kepler_data.csv'))
  .pipe(parse({
    comment: '#',
    columns: true,
  }))
  .on('data', async (data) => {
    if (isHabitablePlanet(data)) {
      // habitablePlanets.push(data);
      await savePlanets(data);
    }
  })
  .on('error', (err) => {
    console.log(err);
    reject(err);
  })
  .on('end', async () => {
    // console.log(habitablePlanets.map((planet) => {
    //   return planet['kepler_name'];
    // }));
    const countPlanets = (await getAllPlanets()).length;
    console.log(`${countPlanets} habitable planets found!`);
    resolve();
  });
})
}

async function getAllPlanets(){
  return await planets.find({}, {'__v':0,'_id':0});
}

async function savePlanets(planet){
  try{
    await planets.updateOne({
      keplerName: planet.keplerName
    },
    {
      keplerName: planet.keplerName
    },
    {upsert: true});
  }
  catch(err){
    console.error(`Could not insert planets`);
  }
}

module.exports = {
    loadPlanetsData,
    getAllPlanets,
}

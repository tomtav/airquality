// Global Variables
// Columbia University 40.8075° N, 73.9626° W
var columbiaUniversity = [40.8075, -73.9626];
var latitudeList = [];
var longitudeList = [];
var coordinatesList = [];
var treeList = [];
var treeNamesList = [];
var treeLatinList = [];
var treeZipcodeList = [];
var treeZipcityList = [];
var treeBoronameList = [];
var treeTrunkList = [];
var totalTrees = 0;
var treesShown = 10000;


// Create a Leaflet map object
var treeMap = L.map("map", {
  center: columbiaUniversity,
  zoom: 12
});

// Icon
// https://leafletjs.com/examples/custom-icons/
var greenIcon = L.icon({
  iconUrl: 'leaf-green.png',
  shadowUrl: 'leaf-shadow.png',

  iconSize:     [38, 95], // size of the icon
  shadowSize:   [50, 64], // size of the shadow
  iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
  shadowAnchor: [4, 62],  // the same for the shadow
  popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

//L.marker([51.5, -0.09], {icon: greenIcon}).addTo(map);

// Add a tile layer
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  maxZoom: 18,
  id: 'mapbox/streets-v11',
  tileSize: 512,
  zoomOffset: -1,
  accessToken: API_KEY
}).addTo(treeMap);

d3.csv("Tree.csv", function(data){

    var treeData = data;
    var treeLocation = data["Location 1"];
    for (var i=0; i< data.length; i++){
      treeNamesList.push(data[i].spc_common);
      treeLatinList.push(data[i].spc_latin);
      treeList.push(data[i].OBJECTID);
      coordinatesList.push(data[i]["Location 1"]);
      latitudeList.push(data[i].latitude);
      longitudeList.push(data[i].longitude);
      treeZipcodeList.push(data[i].zipcode);
      treeBoronameList.push(data[i].boroname);
      treeZipcityList.push(data[i].zip_city);
      treeTrunkList.push(data[i].trunk_dmg);
    };

    // Total Trees in Trees.csv 592372
    totalTrees = treeList.length;
    console.log("Total Trees in the Database " + totalTrees);


    // Loop through the Trees array and create one marker for each Tree, bind a popup containing its name and id.
  for (var i = 0; i < treesShown; i++) {
      var tree = treeList[i];
      var treeZipcity = treeZipcityList[i];
      var treeName = treeNamesList[i];
      var treeLatinName = treeLatinList[i];
      var treeTrunk = treeTrunkList[i];
      var treeLocation = [+latitudeList[i], +longitudeList[i]];

      L.marker(treeLocation, {icon: greenIcon})
        .bindPopup("<h1> ID : " + tree + "</h1> <hr> <h1> " + treeName + "</h1> <hr> <h1> " + treeLatinName + "</h1>")
        .addTo(treeMap);
    }

});


// Trees.csv
//OBJECTID,cen_year,tree_dbh,address,tree_loc,
//pit_type,soil_lvl,status,spc_latin,spc_common,
//vert_other,vert_pgrd,vert_tgrd,vert_wall,horz_blck,
//horz_grate,horz_plant,horz_other,sidw_crack,sidw_raise,
//wire_htap,wire_prime,wire_2nd,wire_other,inf_canopy,
//inf_guard,inf_wires,inf_paving,inf_outlet,inf_shoes,
//inf_lights,inf_other,trunk_dmg,zipcode,zip_city,cb_num,
//borocode,boroname,cncldist,st_assem,st_senate,nta,nta_name,
//boro_ct,state,latitude,longitude,x_sp,y_sp,objectid_1,
//census tract,bin,bbl,Location 1

//OBJECTID
//spc_latin
//spc_common
//zipcode
//zip_city
//latitude
//longitude
//Location 1
//boroname


//To Do
//List of all the Common Names of the Trees
//List of all the Latin Names of the Trees
//List of all the Borough Names
//List of all the Zip Codes

//https://leafletjs.com/examples/choropleth/


/*
//https://colorbrewer2.org/#type=sequential&scheme=Greens&n=9
#f7fcf5
#e5f5e0
#c7e9c0
#a1d99b
#74c476
#41ab5d
#238b45
#006d2c
#00441b
*/
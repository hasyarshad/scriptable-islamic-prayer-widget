// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: brown; icon-glyph: magic;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: moon;

//Customise:
// Set up the location logic.
let fm = FileManager.iCloud()
const locationPath = fm.joinPath(fm.documentsDirectory(), "myLocation.json")

//Define Location
var latitude, longitude
const LocationCacheExists = fm.fileExists(locationPath)
const LocationCacheDate = LocationCacheExists ? fm.modificationDate(locationPath) : 0
try {
// If cache exists and it’s been less than 60 minutes since last request, use cached data.
if (LocationCacheExists && (today.getTime() - LocationCacheDate.getTime()) < (60 * 60 * 1000))
  {
    console.log("Get your location from the Cache")
    const locationStr = fm.readString(locationPath).split(",")
    latitude = locationStr[0]
    longitude = locationStr[1]
    } else {
    Location.setAccuracyToHundredMeters()
    const location = await Location.current()
    console.log("Get Your Location")
    latitude = location.latitude.toFixed(3)
    longitude = location.longitude.toFixed(3)
    fm.writeString(locationPath, latitude + "," + longitude)
  }
  } catch (e) {
    console.log(e)
    const locationStr = fm.readString(locationPath).split(",")
    latitude = locationStr[0]
    longitude = locationStr[1]
  }
const school = "1" // 1 for hanafi 0 for shafi
const method = "1" //calculation method: https://aladhan.com/prayer-times-api#GetTimings - (http://praytimes.org/wiki/Calculation_Methods)
var iconImg = SFSymbol.named("calendar.badge.plus")
const language = "English" // Arabic or English
let jsonPath = fm.joinPath(fm.documentsDirectory(), "Prayer-Time-Widget.json")
let jsonPath1 = fm.joinPath(fm.documentsDirectory(), "Islamic-date.json")


const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
try {
  var prayerTimes = await getPrayerJson(latitude, longitude, school, method)
  var islamicDates = await getIslamicDateJason(latitude, longitude, school, method)
} catch {
  var prayerTimes = JSON.parse(fm.readString(jsonPath))
  var islamicDates = JSON.parse(fm.readString(jsonPath1))
}

let prayerTime = getTime(prayerTimes, prayers)
let islamicDate = getDate(islamicDates)

if (config.runsInWidget) {
  let widget = await createWidget(prayerTime, iconImg, language, islamicDate, prayerTimes)
  const nobg = importModule('no-background.js')
  widget.backgroundImage = await nobg.getSliceForWidget(Script.name())
  Script.setWidget(widget)
  Script.complete()
} else {
  let widget = await createWidget(prayerTime, iconImg, language, islamicDate, prayerTimes)
  const nobg = importModule('no-background.js')
  widget.backgroundImage = await nobg.getSliceForWidget(Script.name())
  await widget.presentSmall()
}

async function getPrayerJson(lat, lon, school, method) {
  let fm = FileManager.iCloud()
  let jsonPath = fm.joinPath(fm.documentsDirectory(), "Prayer-Time-Widget.json")
  let url = "http://api.aladhan.com/v1/timings?latitude=" + lat + "&longitude=" + lon + "&method=" + method + "&school=" + school
  let req = new Request(url)
  let json = await req.loadJSON()
  fm.writeString(jsonPath, JSON.stringify(json.data.timings))
  return json.data.timings
}

async function getIslamicDateJason(lat, lon, school, method) {
  let fm = FileManager.iCloud()
  let jsonPath1 = fm.joinPath(fm.documentsDirectory(), "Islamic-date.json")
  let url = "http://api.aladhan.com/v1/timings?latitude=" + lat + "&longitude=" + lon + "&method=" + method + "&school=" + school + "&adjustment=-1"
  let req = new Request(url)
  let json = await req.loadJSON()
  fm.writeString(jsonPath1, JSON.stringify(json.data.date))
  return json.data.date
}

function getTime(prayerTimes, prayers) {
  let today = new Date()
  if (today.getHours() < 10) {
    var h = "0" + today.getHours()
  } else {
    var h = today.getHours()
  }
  if (today.getMinutes() < 10) {
    var m = "0" + today.getMinutes()
  } else {
    var m = today.getMinutes()
  }
  let time = h + ":" + m
  for (const [index, prayer] of prayers.entries()) {
    if (index && time < prayerTimes[prayer]) {
      if (time >= "00:00" && time <= prayerTimes['Fajr']) {
        let nextPrayer = "Fajr"
        let nextPrayerTime = prayerTimes['Fajr']
        let currPrayer = "Isha"
        let currPrayerTime = prayerTimes['Isha']
        return [currPrayer, currPrayerTime, nextPrayer, nextPrayerTime, time]
      } else {
        let nextPrayer = prayer
        let nextPrayerTime = prayerTimes[prayer]
        let currPrayer = prayers[index - 1]
        let currPrayerTime = prayerTimes[currPrayer]
        return [currPrayer, currPrayerTime, nextPrayer, nextPrayerTime, time]
      }
    } else if (prayer === "Isha") {
      let nextPrayer = "Fajr"
      let nextPrayerTime = prayerTimes['Fajr']
      let currPrayer = "Isha"
      let currPrayerTime = prayerTimes['Isha']
      return [currPrayer, currPrayerTime, nextPrayer, nextPrayerTime, time]
    }
  }
}

function getDate(islamicDates) {
  let currDate = islamicDates.hijri.day
  let currMonth = islamicDates.hijri.month.en
  let currYear = islamicDates.hijri.year
  let yearAbbre = islamicDates.hijri.designation.abbreviated
  return [currDate, currMonth, currYear, yearAbbre]
}

async function createWidget(prayerTime, iconImg, lang, islamicDate, pTimes) {
  let w = new ListWidget()
//   let end = toDate(prayerTime[3], "h:m", prayerTime[2])
  let nextTime = tConvert(prayerTime[3])
  let currentTime = tConvert(prayerTime[1])
  let end = toDate(prayerTime[3], prayerTime[0], prayerTime[1])
  
  let prayerNames = changeLang(lang, prayerTime)
  w.setPadding(30, 8, 10, 8)
  main_color = new Color("#ffffff")

  let row = w.addStack()
  row.layoutHorizontally()
  row.addSpacer(10)
  let logoImgStack = row.addStack()
  logoImgStack.layoutVertically()
  logoImgStack.addSpacer(6)
  const icon = logoImgStack.addImage(iconImg.image)
  icon.imageSize = new Size(28, 28)
  icon.tintColor = main_color
//   icon.imageOpacity = 0.8
//   logoImgStack.backgroundColor = main_color
//   logoImgStack.cornerRadius = 8
  row.addSpacer(5)

  let column = row.addStack()
  column.layoutVertically()
  let cdate = column.addText(islamicDate[0])
  cdate.font = Font.boldSystemFont(20)
  cdate.textColor = Color.red()
//   cdate.textOpacity = 1

  let cmonth = column.addText(islamicDate[1] + " " + islamicDate[2] + " " + islamicDate[3])
  cmonth.font = Font.mediumSystemFont(11)
  cmonth.textColor = main_color
//   cmonth.textOpacity = 0.8
  w.addSpacer(8)
  
  if(prayerTime[4] >= pTimes["Sunrise"] && prayerTime[4] < pTimes["Dhuhr"]){
    let cptext = w.addText(prayerNames[1] + " starts in")
    cptext.font = Font.mediumSystemFont(11)
    cptext.textColor = main_color
//     cptext.textOpacity = 0.8;
    cptext.centerAlignText()
    w.addSpacer(0)
  } else {
    let cptext = w.addText(prayerNames[0] + " ends in")
    cptext.font = Font.mediumSystemFont(11)
    cptext.textColor = main_color
//     cptext.textOpacity = 0.8;
    cptext.centerAlignText()
    w.addSpacer(0)
  }

  let cdtime = w.addDate(end)
//   console.log(cdtime)
  cdtime.applyRelativeStyle()
//   cdtime.applyTimerStyle()
  cdtime.font = Font.boldSystemFont(16)
  cdtime.centerAlignText()
  cdtime.textColor = Color.red()
  w.addSpacer(8)

  let nptext = w.addText("Next prayer is " + prayerNames[1] + " at")
  nptext.font = Font.mediumSystemFont(11)
  nptext.textColor = main_color
//   nptext.textOpacity = 0.8;
  nptext.centerAlignText()
  w.addSpacer(0)

  let nptime = w.addText(nextTime)
  nptime.font = Font.boldSystemFont(16)
  nptime.textColor = Color.red()
  nptime.centerAlignText()
  w.addSpacer(15)
  
  let ctext = w.addText("Created by Using")
  ctext.font = Font.mediumSystemFont(8)
  ctext.textColor = main_color
  ctext.centerAlignText()
//   ctext.textOpacity = 0.8;

  return w
}

function changeLang(lang, prayers) {
  if (lang === "Arabic") {
    let arabic = {
      "Fajr": "الفجر",
      "Sunrise": "طلوع آفتاب",
      "Dhuhr": "ٱلظُّهْر",
      "Asr": "العصر",
      "Maghrib": "المغرب",
      "Isha": "العشاء"
    }
    return [arabic[prayers[0]], arabic[prayers[2]]]
  } else {
    return [prayers[0], prayers[2]]
  }
}

function tConvert(time) {
  // Check correct time format and split into components
  time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];



  if (time.length > 1) { // If time format correct
    time = time.slice(1); // Remove full string match value
    time[3] = +time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
  }
  return time.join(''); // return adjusted time or original string

}

function toDate(dStr, curPrayer, curPrayerTime) {
  if(curPrayer == "Isha"){
    let checkHour = curPrayerTime.substring(0, curPrayerTime.indexOf(":"));
    let checkMinutes =  curPrayerTime.substring(dStr.indexOf(":")+1);
//      console.log(checkMinutes)
    var now = new Date();
//     console.log(now.getMinutes())
    if(now.getHours() >= checkHour || now.getMinutes() == checkMinutes){
      now.setDate(now.getDate() + 1);
    }
  } else {
      var now = new Date();
    }
  
  now.setHours(dStr.substring(0, dStr.indexOf(":")));
 now.setMinutes(dStr.substring(dStr.indexOf(":")+1));
  now.setSeconds(0);
  return now;
}


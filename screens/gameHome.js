import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View, Image, Pressable } from "react-native";
import MyButton from "../components/MyButton";
import { SelectList } from "react-native-dropdown-select-list";
import React, { useEffect, useRef, useState } from "react";
import CheckBox from "expo-checkbox";
import * as SQLite from "expo-sqlite";
import axios from "axios";

// const ip = "http://192.168.1.4:3000";
const ip = "https://mayhembackend.onrender.com";

let mayhemLogo = require("../assets/logo.png");
let allImages = {
  supernova: require("../assets/supernova.png"),
  thunder: require("../assets/thunder.png"),
  alex: require("../assets/alex.png"),
  natives: require("../assets/natives.png"),
  zayed: require("../assets/zayed.png"),
  airbenders: require("../assets/airbenders.png"),
  pharos: require("../assets/pharos.png"),
  mudd: require("../assets/mudd.png"),
  any: require("../assets/anyOpponent.png"),
};

const GameHome = ({ route, navigation }) => {
  const db = SQLite.openDatabase("game.db");

  const [isCheckBoxDisabled, setIsCheckboxDisabled] = useState(false);

  const {
    opponent,
    timestamp,
    category,
    home,
    myScore,
    startOffence,
    theirScore,
  } = route.params.game;

  let year = timestamp.substring(0, 4);
  let month = timestamp.split("-")[1];
  let day = timestamp.split("-")[2];
  day = day.split(" ")[0];
  let time = timestamp.split(" ")[1];
  let hour = time.split(":")[0];
  let minute = time.split(":")[1];
  let second = time.split(":")[2];
  let timeStamp = new Date(year, month - 1, day, hour, minute, second);

  let timeStr =
    timeStamp.getFullYear() +
    "-" +
    (timeStamp.getMonth() + 1) +
    "-" +
    timeStamp.getDate() +
    " " +
    timeStamp.getHours() +
    ":" +
    timeStamp.getMinutes() +
    ":" +
    timeStamp.getSeconds();

  // console.log("str", timeStr);
  // console.log("ts", timestamp);
  const [toggleCheckBox, setToggleCheckBox] = useState(false);

  function changeCheckbox() {
    setToggleCheckBox(!toggleCheckBox);
  }
  const [paddingCheckbox, setPaddingCheckbox] = useState(0);
  const onLayout = (event) => {
    const { x, y, height, width } = event.nativeEvent.layout;
    setPaddingCheckbox(x);
  };

  async function onCheckboxChange(newValue) {
    setToggleCheckBox(newValue);

    // let timeStamp = new Date(timestamp);
    // // timeStr to be used in sql query
    // let timeStr =
    //   timeStamp.getFullYear() +
    //   "-" +
    //   (timeStamp.getMonth() + 1) +
    //   "-" +
    //   timeStamp.getDate() +
    //   " " +
    //   timeStamp.getHours() +
    //   ":" +
    //   timeStamp.getMinutes() +
    //   ":" +
    //   timeStamp.getSeconds();

    console.log(timeStr);
    await db.transaction((tx) => {
      tx.executeSql(
        `
        UPDATE game SET startOffence = ${
          newValue ? 1 : 0
        } WHERE timestamp = "${timeStr}" AND opponent = "${opponent}";
        `,
        null,
        (tx, results) => {
          console.log("Query completed");
          console.log(results);
        },
        (tx, error) => {
          console.log("Error: " + error);
        }
      );
    });

    await axios({
      method: "put",
      url: ip + "/gameUpdateOffence",
      data: {
        timestamp: timeStr,
        opponent: opponent,
        newValue: newValue,
      },
    })
      .then((response) => {
        // console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  }
  function renderDetails() {
    return (
      <View width="100%">
        <View style={styles.details}>
          <View
            onLayout={onLayout}
            style={{ paddingHorizontal: 20, backgroundColor: "#fff" }}
          >
            <Text style={styles.text}>Time:</Text>
            <Text style={styles.text}>Opponent:</Text>
            <Text style={styles.text}>Tournament:</Text>
          </View>
          <View>
            <Text style={styles.text2}>{timeStr}</Text>
            <Text style={styles.text2}>{opponent}</Text>
            <Text style={styles.text2}>{category}</Text>
          </View>
        </View>
        <View>
          <Pressable onPress={changeCheckbox}>
            <View paddingLeft={20}>
              <View
                style={[styles.container2, { paddingLeft: paddingCheckbox }]}
              >
                <Text style={styles.text}>Starting on Offence?</Text>
                <CheckBox
                  disabled={isCheckBoxDisabled}
                  value={toggleCheckBox}
                  onValueChange={(newValue) => onCheckboxChange(newValue)}
                  style={{ marginLeft: 10 }}
                />
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    );
  }

  function onScreenLoad() {
    let year = timestamp.substring(0, 4);
    let month = timestamp.split("-")[1];
    let day = timestamp.split("-")[2];
    day = day.split(" ")[0];

    let time = timestamp.split(" ")[1];
    let hour = time.split(":")[0];
    let minute = time.split(":")[1];
    let second = time.split(":")[2];

    let timeStamp = new Date(year, month - 1, day, hour, minute, second);

    // timeStr to be used in sql query
    let timeStr =
      timeStamp.getFullYear() +
      "-" +
      (timeStamp.getMonth() + 1) +
      "-" +
      timeStamp.getDate() +
      " " +
      timeStamp.getHours() +
      ":" +
      timeStamp.getMinutes() +
      ":" +
      timeStamp.getSeconds();

    // console.log(timeStr);

    // console.log(opponent);

    db.transaction((tx) => {
      tx.executeSql(
        `
        SELECT startOffence FROM game WHERE timestamp = "${timeStr}" AND opponent = "${opponent}";
        `,
        null,
        (tx, results) => {
          // console.log("Query completed");
          // console.log(results);
          if (results.rows._array[0].startOffence === 1) {
            setToggleCheckBox(true);
          } else {
            setToggleCheckBox(false);
          }
        },
        (tx, error) => {
          console.log("Error: " + error);
        }
      );
    });
    //check if we recorded any actions for this game
    db.transaction((tx) => {
      tx.executeSql(
        `
        SELECT COUNT(*) FROM actionPerformed WHERE gameTimestamp = "${timeStr}" AND opponent = "${opponent}" AND action != 'In Point';
        `,
        null,
        (tx, results) => {
          // console.log("Query completed");
          // console.log(results.rows._array);

          if (results.rows._array[0]["COUNT(*)"] !== 0) {
            setIsCheckboxDisabled(true);
          } else {
            setIsCheckboxDisabled(false);
          }
        },
        (tx, error) => {
          console.log("Error: " + error);
        }
      );
    });
  }

  useEffect(() => {
    onScreenLoad();
  }, []);

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          justifyContent: "center",
        }}
      >
        <Image source={mayhemLogo} style={styles.image} />
        <View justifyContent="center">
          <Text
            style={{
              fontSize: 30,
              fontWeight: "bold",
              justifyContent: "flex-end",
            }}
          >
            vs.
          </Text>
        </View>
        <Image
          source={allImages[opponent.toLowerCase()]}
          style={styles.image}
        />
      </View>
      {/* Display the items from renderDetails() */}
      {renderDetails()}
      <View
        style={{
          width: "100%",
          alignItems: "center",
          flex: 1,
          justifyContent: "flex-end",
          marginBottom: 200,
        }}
      >
        <MyButton
          onPress={() =>
            navigation.navigate("Record Game", {
              opponent: opponent,
              timestamp: timeStr,
              startOffence: Boolean(toggleCheckBox),
            })
          }
          text={"Start/Continue Recording"}
        />
        <MyButton
          onPress={() =>
            navigation.navigate("View Game Events", {
              opponent: opponent,
              timestamp: timeStr,
            })
          }
          text={"View Events"}
        />
        <MyButton text={"View Stats"} />
      </View>
    </View>
  );
};

export default GameHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  container2: {
    flex: 0,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    flexDirection: "row",
  },
  image: {
    width: 70,
    height: 70,
    margin: 20,
  },
  text: { fontSize: 16, color: "#000000", marginVertical: 5 },
  text2: { fontSize: 16, color: "#808080", marginVertical: 5 },
  details: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#fff",
    paddingTop: 30,
    alignContent: "center",
    justifyContent: "center",
  },
});

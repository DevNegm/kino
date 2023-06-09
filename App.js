import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  CameraRoll,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import FeatherIcons from "@expo/vector-icons/Feather";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Permissions } from 'expo';
import * as MediaLibrary from 'expo-media-library';
import Api from "./Api";
const Loader = () => {
  return (
    <View style={{position:"absolute",left:0,top:0,zIndex:9999,backgroundColor:"rgba(0,0,0,0.7)",justifyContent:"center",alignItems:"center",width:"100%",height:"100%"}}><ActivityIndicator size="large" color="#fff" /></View>
  )
}
export default function App() {
  const { width, height } = Dimensions.get("screen");
  const imageSize = 80;
  const Spacing = 15;
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagenum, setPagenum] = useState(1);
 
  const fetchPhotos =  () => {
     Api.get("/",{params: {page:pagenum}}).then((res) => {
      setPhotos([...photos,...res?.data?.hits]);
    })
    .catch((e) => console.log(e))
  };
  useEffect(() => {
    fetchPhotos(pagenum);
  }, [pagenum]);

  const loadMore = () => {
    setPagenum(pagenum+1)
  }

  const topRef = useRef();
  const thumbRef = useRef();
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToActiveIndex = (index) => {
    setActiveIndex(index);
    topRef?.current?.scrollToOffset({
      offset: index * width,
      animated: true,
    });
    if (index * (imageSize + Spacing) - imageSize / 2 > width / 2) {
      thumbRef?.current?.scrollToOffset({
        offset: index * (imageSize + Spacing) - width / 2 + imageSize / 2,
        animated: true,
      });
    } else {
      thumbRef?.current?.scrollToOffset({
        offset: 0,
        animated: true,
      });
    }
  };


  const Share = (image) => {
    setLoading(true)
    const image_source = image;
    FileSystem.downloadAsync(
      image_source,
      FileSystem.documentDirectory + ".jpeg"
    )
      .then(({ uri }) => {
        setLoading(false)
        Sharing.shareAsync(uri, {
          mimeType: "image/jpeg", // Android
          dialogTitle: "share-dialog title", // Android and Web
          UTI: "image/jpeg", // iOS
        });
      })
      .catch((error) => {
        console.error(error);
      });
  };
  const Download = async (image,filename) => {
    setLoading(true)

    let fileUri = FileSystem.documentDirectory + `${filename}.jpg`;
    try {
        const res = await FileSystem.downloadAsync(image, fileUri)
        console.log(res)
        saveFile(res.uri)
    } catch (err) {
        console.log("FS Err: ", err)
    }
  };
  const saveFile = async (fileUri) => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setLoading(false)

    if (status === "granted") {
      Alert.alert("Saved to gallery")
        try {
            const asset = await MediaLibrary.createAssetAsync(fileUri);
            const album = await MediaLibrary.getAlbumAsync('Download');
            if (album == null) {
                await MediaLibrary.createAlbumAsync('Download', asset, false);
            } else {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }
        } catch (err) {
            console.log("Save err: ", err)
        }
    } else if (status === "denied") {
        Alert.alert("please allow permissions to download")
    }
}

  if (!photos) {
    return <Text>Loading...</Text>;
  }
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
              {loading && <View style={{position:"absolute",left:0,top:0,zIndex:9999,backgroundColor:"rgba(0,0,0,0.7)",justifyContent:"center",alignItems:"center",width:"100%",height:"100%"}}><ActivityIndicator size="large" color="#fff" /></View>}

      <StatusBar style="auto" />
      <FlatList
        ref={topRef}
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onEndReached={loadMore}
        ListFooterComponent={Loader}
        onEndReachedThreshold={0}
        keyExtractor={ (item) =>  item?.id.toString() }
        onMomentumScrollEnd={(ev) => {
          scrollToActiveIndex(
            Math.round(ev.nativeEvent.contentOffset.x / width)
          );
        }}
        renderItem={({ item }) => {
          return (
            <View style={{ width, height, position: "relative" }}>
              
              <Image
                source={{ uri: item?.largeImageURL }}
                style={[StyleSheet.absoluteFillObject]}
              />
              <TouchableOpacity
                onPress={() => Share(item?.largeImageURL)}
                style={{
                  position: "absolute",
                  right: 15,
                  bottom: 240,
                  flex: 1,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 14, color: "#fff", fontWeight: "bold" }}
                >
                  Share This Photo
                </Text>
                <View
                  style={{
                    padding: 12,
                    borderRadius: 100,
                    backgroundColor: "#000",
                    marginLeft: 14,
                  }}
                >
                  <FeatherIcons size={20} color={"#fff"} name="share-2" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Download(item?.largeImageURL)}
                style={{
                  position: "absolute",
                  right: 15,
                  bottom: 180,
                  flex: 1,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 14, color: "#fff", fontWeight: "bold" }}
                >
                  Download This Photo
                </Text>
                <View
                  style={{
                    padding: 12,
                    borderRadius: 100,
                    backgroundColor: "#000",
                    marginLeft: 14,
                  }}
                >
                  <FeatherIcons size={20} color={"#fff"} name="download" />
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <FlatList
        ref={thumbRef}
        data={photos}
        keyExtractor={ (item) =>  item?.id.toString() }
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ position: "absolute", bottom: Spacing }}
        contentContainerStyle={{ paddingHorizontal: Spacing }}
        renderItem={({ item, index }) => {
          return (
            <TouchableOpacity onPress={() => scrollToActiveIndex(index)}>
              <Image
                source={{ uri: item.previewURL }}
                style={{
                  width: imageSize,
                  height: imageSize,
                  borderRadius: 12,
                  marginRight: Spacing,
                  borderWidth: 2,
                  borderColor: activeIndex === index ? "#fff" : "transparent",
                }}
              />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

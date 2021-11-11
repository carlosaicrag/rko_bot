const fs = require('fs');
const Promise = require('bluebird')
const { auth } = require('./config/config.js');
const T = auth();
var stream = T.stream('statuses/filter', { track: 'wen reveal', language: 'en' })


// media upload methods

const initMediaUpload = (client, pathToFile) => {
    const mediaType = "image/gif";
    const mediaSize = fs.statSync(pathToFile).size
    return new Promise((resolve, reject) => {
        client.post("media/upload", {
            command: "INIT",
            total_bytes: mediaSize,
            media_type: mediaType,
        }, (error, data, response) => {
            if (error) {
                console.log(error)
                reject(error)   
            } else {
                console.log("Initialized Media Upload")
                resolve(data.media_id_string)
            }
        })
    })
}

const appendMedia = (client, mediaId, pathToFile) => {
    const mediaData = fs.readFileSync(pathToFile, { encoding: 'base64' })
    return new Promise((resolve, reject) => {
        client.post("media/upload", {
            command: "APPEND",
            media_id: mediaId,
            media_data: mediaData,
            segment_index: 0
        }, (error, data, response) => { 
            if (error) {
                console.log(error)
                reject(error)   
            } else {
                console.log("Appended Media")    
                resolve(mediaId)
            }
        })
    })
}

const finalizeMediaUpload = (client, mediaId) => {
    return new Promise((resolve, reject) =>  {
        client.post("media/upload", {
            command: "FINALIZE",
            media_id: mediaId
        }, (error, data, response) => {
            if (error) {
                console.log(error)
                reject(error)
            } else {
                console.log("Finalized Media")
                resolve(mediaId)
            }
        })
    })
}

stream.on('tweet', async function (tweet) {
    console.log("Starting RKO Reply Tweet")
    postReplyWithMedia(T,"./media/rko.gif",tweet)

})


const postReplyWithMedia = (client, mediaFilePath, replyTweet) => {

    initMediaUpload(client, mediaFilePath)
        .then((mediaId) => appendMedia(client, mediaId, mediaFilePath))
        .then((mediaId) => finalizeMediaUpload(client, mediaId))
        .then((mediaId) => {
            let statusObj = {
                status: "OH MY GOODNESS @" + replyTweet.user.screen_name + " ",
                in_reply_to_status_id: replyTweet.id_str,
                media_ids: mediaId
            }
            client.post('statuses/update', statusObj, (error, tweetReply, response) => {

                //if we get an error print it out
                if (error) {
                    console.log(error);
                }
                console.log(`Successfully Replied to ${replyTweet.user.screen_name}`)
                //print the text of the tweet we sent out
                console.log(tweetReply.text);
            });
        })
        .catch((err) => {
            console.log(err)
        })
}


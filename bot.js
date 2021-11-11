const Twit = require('twit')
const fs = require('fs');
const Promise = require('bluebird')
const dotenv = require("dotenv");
const { Console } = require('console');
dotenv.config()

const T = new Twit({
    consumer_key: "eMy9Z39XlbTvawx1Q6DQnhTKp",
    consumer_secret: "65DJvZi4LA8rSWbNxW9PFASxT3qQGcZjFKx0FTLc5wm6aq3e5N",
    access_token: "1458460832099078145-HUBHKUeFhV3XIDcpER7TUSbaapUMjy",
    access_token_secret: "2lSlBh5ct4yVEPLtfam6yTy8Pk1LtMsitn4tWCPyQpCuS"
})

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
                resolve(data.media_id_string)
            }
        })
    })
}

const appendMedia = (client, mediaId, pathToFile) => {
    const mediaData = fs.readFileSync(pathToFile, { encoding: 'base64' })
    console.log(mediaData)
    return new Promise((resolve, reject) => {
        client.post("media/upload", {
            command: "APPEND",
            media_id: mediaId,
            media_data: mediaData,
            segment_index: 0
        }, (error, data, response) => { 
            console.log("2")    
            if (error) {
                console.log(error)
                reject(error)   
            } else {
                console.log(mediaId)
                resolve(mediaId)
            }
        })
    })
}

const finalizeMediaUpload = (client, mediaId) => {
    console.log("3")
    return new Promise((resolve, reject) =>  {
        client.post("media/upload", {
            command: "FINALIZE",
            media_id: mediaId
        }, (error, data, response) => {
            if (error) {
                console.log(error)
                reject(error)
            } else {
                resolve(mediaId)
            }
        })
    })
}

stream.on('tweet', async function (tweet) {
    console.log("0")
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

                //print the text of the tweet we sent out
                console.log(tweetReply.text);
            });
        })
        .catch((err) => {
            console.log(err)
        })
}


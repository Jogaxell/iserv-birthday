import {config} from "dotenv";
import axios from "axios";
import DomParser from "dom-parser";
import moment from "moment";

config();

let client = axios.create({
    baseURL: process.env.HOST,
    maxRedirects: 0,
    validateStatus: function (status) {
        return status >= 200 && status < 303;
    }
})

async function run() {
    await login()
    await updateBirthday()
}

async function login() {
    const params = new URLSearchParams()
    params.append("_username", process.env.NAME as string)
    params.append("_password", process.env.PASSWORD as string)

    const loginData = await client.post("login_check", params)

    client = axios.create({
        baseURL: process.env.HOST,
        maxRedirects: 0,
        headers: {
            // @ts-ignore
            "cookie": loginData.headers["set-cookie"] || ''
        },
        validateStatus: function (status) {
            return status >= 200 && status < 303;
        }
    })
}

async function findPublicContactToken(): Promise<string> {
    const response = await client.get("profile/public/edit");
    const parser = new DomParser()
    const data = parser.parseFromString(response.data)
    return data.getElementById("publiccontact__token")?.getAttribute("value") as string
}

async function updateBirthday() {
    const tomorrow = moment().add(1, "days").format("DD.MM.YYYY")

    const params = new URLSearchParams()
    params.append("publiccontact[birthday]", tomorrow)
    params.append("publiccontact[_token]", await findPublicContactToken())
    params.append("publiccontact[hidden]", "0")
    const response = await client.post("profile/public/edit", params)
    if (response.status == 200 || response.status == 302) {
        console.log("Birthday updated to " + tomorrow)
    } else {
        console.log("Error updating birthday to " + tomorrow)
        console.log("ERROR: " + response.status)
    }
}

run()
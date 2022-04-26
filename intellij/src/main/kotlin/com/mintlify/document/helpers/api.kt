package com.mintlify.document.helpers

import com.github.kittinunf.fuel.core.extensions.jsonBody
import com.github.kittinunf.fuel.httpPost
import com.github.kittinunf.fuel.httpGet
import com.google.gson.Gson
import com.beust.klaxon.Klaxon

data class Custom(
    var language: String,
)

data class RequestBody(
    var userId: String,
    var code: String,
    var languageId: String?,
    var fileName: String?,
    var context: String,
    var width: Int,
    var commented: Boolean,
    var email: String,
    var docStyle: String,
    var source: String,
    // For no-selection
    var location: Int,
    var line: String,
    var custom: Custom,
)

data class WorkerResponse(
    var id: String,
)

data class Response(
    var docstring: String,
    var position: String,
)

data class WorkerStatusResponse(
    var id: String,
    var state: String,
    var reason: String? = null,
    var data: Response? = null,
)

fun getDocFromApi(
    code: String,
    languageId: String?,
    fileName: String?,
    context: String = code,
    width: Int = 80,
    commented: Boolean = true,
    email: String = "",
    docStyle: String = "Auto-detect",
    location: Int,
    line: String,
    custom: Custom
): Response? {
    val source = "intellij"
    val userId = System.getProperty("user.name")
    val body = RequestBody(userId, code, languageId, fileName, context, width, commented, email, docStyle, source, location, line, custom)

    val apiBase = "https://api.mintlify.com/docs"
    var endpoint = "$apiBase/write/v3"
    if (code.isEmpty()) {
        endpoint += "/no-selection"
    }

    val (_, _, result) = endpoint.httpPost()
        .jsonBody(Gson().toJson(body).toString())
        .responseString()
    val (payload, _) = result

    if (payload != null) {
        val id = Klaxon().parse<WorkerResponse>(payload)?.id ?: return null
        var completedResponse: Response? = null
        val timeIncrement = 100
        var timeElapsedInMs = 0

        while (completedResponse == null && timeElapsedInMs < 25000) {
            val (_, _, resultFromWorker) = "$apiBase/worker/$id".httpGet().responseString()
            val (statusPayload, _) = resultFromWorker
            if (statusPayload != null) {
                val status = Klaxon().parse<WorkerStatusResponse>(statusPayload)
                if (status != null) {
                    if (status.state == "completed" && status.data != null) {
                        completedResponse = status.data
                    }
                }
            }
            Thread.sleep(timeIncrement.toLong())
            timeElapsedInMs += timeIncrement
        }

        return completedResponse
    }

    return null
}
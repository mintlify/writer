package com.mintlify.document.listeners

import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import com.intellij.openapi.startup.StartupActivity
import com.mintlify.document.services.MyProjectService

internal class MyProjectManagerListener : StartupActivity {
    override fun runActivity(project: Project) {
        project.service<MyProjectService>()
    }


}
package com.mintlify.document.services

import com.intellij.openapi.project.Project
import com.mintlify.document.MyBundle

class MyProjectService(project: Project) {

    init {
        println(MyBundle.message("projectService", project.name))
    }
}

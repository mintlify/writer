package com.mintlify.document.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.command.WriteCommandAction
import com.intellij.openapi.editor.Caret
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.editor.Document
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.progress.ProgressIndicator
import com.intellij.openapi.project.Project
import com.intellij.openapi.progress.ProgressManager
import com.intellij.openapi.progress.Task
import com.intellij.notification.Notification
import com.intellij.notification.Notifications
import com.intellij.notification.NotificationType

import com.mintlify.document.helpers.getDocFromApi
import com.mintlify.document.ui.DocsWindowFactory
import com.mintlify.document.helpers.Custom

class PopupDialogAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {

        val project: Project = e.getRequiredData(CommonDataKeys.PROJECT)
        val editor: Editor = FileEditorManager.getInstance(project).selectedTextEditor!!
        val document: Document = editor.document

        val myToolWindow = DocsWindowFactory.getWindow(project)
        val selectedDocFormat = myToolWindow?.selectedDocFormat ?: "Auto-detect"
        val selectedLanguage = myToolWindow?.selectedLanguage ?: "English"

        val currentCaret: Caret = editor.caretModel.currentCaret
        val selectedText = currentCaret.selectedText?.trim() ?: ""
        val selectionStart = currentCaret.selectionStart
        val documentText = document.text
        val start = documentText.indexOf(selectedText, selectionStart)
        // Get space before start line
        val startLineNumber = document.getLineNumber(start)
        val whitespaceBeforeLine = getWhitespaceOfLineAtOffset(document, startLineNumber)
        val selectedFile = FileEditorManager.getInstance(project).selectedFiles[0]
        val languageId = selectedFile.fileType.displayName.lowercase()

        val width = editor.settings.getRightMargin(project) - whitespaceBeforeLine.length
        val lineText = getLineText(document, startLineNumber)
        // Get indent size
        val tabSize = editor.settings.getTabSize(project)
        val isUseTabCharacter = editor.settings.isUseTabCharacter(project)

        val custom = Custom(selectedLanguage)

        val task = object : Task.Backgroundable(project, "Mintlify doc writer progress") {
            override fun run(indicator: ProgressIndicator) {
                indicator.text = "Generating docs"
                indicator.isIndeterminate = true
                val response = getDocFromApi(
                    code = selectedText,
                    languageId = languageId,
                    fileName = selectedFile.name,
                    context = documentText,
                    width = width,
                    commented = true,
                    docStyle = selectedDocFormat,
                    location = selectionStart,
                    line = lineText,
                    custom = custom
                )
                if (response != null) {
                    val isBelowStartLine = response.position == "belowStartLine"
                    val insertPosition = if (isBelowStartLine) {
                        document.getLineStartOffset(startLineNumber + 1)
                    } else {
                        document.getLineStartOffset(startLineNumber) + whitespaceBeforeLine.length
                    }
                    val insertDoc = getFormattedInsertDoc(response.docstring, whitespaceBeforeLine, isBelowStartLine,
                        tabSize, isUseTabCharacter)

                    WriteCommandAction.runWriteCommandAction(project) {
                        document.insertString(insertPosition, insertDoc)
                    }
                } else {
                    val notification = Notification(
                        "Error",
                        "Unable to generate docs",
                        "Please try again later or report the error to hi@mintlify.com",
                        NotificationType.ERROR
                    )
                    Notifications.Bus.notify(notification, project)
                }
            }
        }
        ProgressManager.getInstance().run(task)
    }
}

fun getWhitespaceSpaceBefore(text: String): String {
    val frontWhiteSpaceRemoved = text.trimStart()
    val firstNoneWhiteSpaceIndex = text.indexOf(frontWhiteSpaceRemoved)
    return text.substring(0, firstNoneWhiteSpaceIndex)
}

fun getLineText(document: Document, lineNumber: Int): String {
    val documentText = document.text
    val startLineStartOffset = document.getLineStartOffset(lineNumber)
    val startLineEndOffset = document.getLineEndOffset(lineNumber)
    return documentText.substring(startLineStartOffset, startLineEndOffset)
}

fun getWhitespaceOfLineAtOffset(document: Document, lineNumber: Int): String {
    val startLine = getLineText(document, lineNumber)
    return getWhitespaceSpaceBefore(startLine)
}

fun getFormattedInsertDoc(docstring: String, whitespaceBeforeLine: String,
                          isBelowStartLine: Boolean = false, tabSize: Int, isUseTabChar: Boolean): String {
    var differingWhitespaceBeforeLine = whitespaceBeforeLine
    var lastLineWhitespace = ""
    // Format for tabbed position
    if (isBelowStartLine) {
        var whitespace = buildString {
            append("\t")
        }
        if (!isUseTabChar) {
            val space = " "
            whitespace = space.repeat(tabSize)
        }
        differingWhitespaceBeforeLine = whitespace + differingWhitespaceBeforeLine
    } else {
        lastLineWhitespace = differingWhitespaceBeforeLine
    }
    val docstringByLines = docstring.lines().mapIndexed { index, line -> (
        if (index == 0 && !isBelowStartLine) {
            line
        } else {
            differingWhitespaceBeforeLine + line
        })
    }
    return docstringByLines.joinToString("\n") + '\n' + lastLineWhitespace
}
package com.mintlify.document.ui;

import com.intellij.openapi.actionSystem.ActionManager;
import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.ex.ActionUtil;
import com.intellij.openapi.actionSystem.ActionPlaces;

import com.intellij.openapi.wm.ToolWindow;
import com.mintlify.settings.ApplicationSettingsState;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;

public class DocsWindow {

  private JPanel myToolWindowContent;
  private JComboBox<String> docFormatSelector;
  private JButton generateDocsButton;
  private JButton joinCommunityLabel;
  private JComboBox<String> languageSelector;

  public DocsWindow(ToolWindow toolWindow) {
    fillDocFormatSelector();

    generateDocsButton.addActionListener(new ActionListener() {
      @Override
      public void actionPerformed(ActionEvent e) {
        ActionManager actionManager = ActionManager.getInstance();
        AnAction action = actionManager.getAction("org.intellij.sdk.action.PopupDialogAction");
        ActionUtil.invokeAction(action, toolWindow.getComponent(), ActionPlaces.TOOLWINDOW_CONTENT, null, null);
      }
    });
    final ApplicationSettingsState instance = ApplicationSettingsState.Companion.getInstance();

    languageSelector.addItem("English");
    languageSelector.addItem("Chinese");
    languageSelector.addItem("French");
    languageSelector.addItem("Korean");
    languageSelector.addItem("Russian");
    languageSelector.addItem("Spanish");
    languageSelector.addItem("Turkish");

    languageSelector.setSelectedItem(instance.getLanguage());
    languageSelector.setEditable(false);
    try {
      final URI joinDiscordUri = new URI("https://discord.gg/6W7GuYuxra");
      joinCommunityLabel.setBorderPainted(false);
      joinCommunityLabel.setOpaque(false);
      joinCommunityLabel.addActionListener(new ActionListener() {
        @Override
        public void actionPerformed(ActionEvent e) {
          if (Desktop.isDesktopSupported()) {
            try {
              Desktop.getDesktop().browse(joinDiscordUri);
            } catch (IOException err) { /* TODO: error handling */ }
          } else { /* TODO: error handling */ }
        }
      });
    } catch (URISyntaxException err) {
      /* TODO: error handling */
    }
  }

  private void fillDocFormatSelector() {
    String[] supportedDocFormats = {"Auto-detect", "Javadoc", "Google", "JSDoc", "reST", "NumPy", "DocBlock", "Doxygen", "XML", "GoDoc", "RustDoc"};
    Arrays.stream(supportedDocFormats)
                    .forEach(docFormat -> docFormatSelector.addItem(docFormat));
    docFormatSelector.setEditable(false);
  }

  public String getSelectedDocFormat() {
    return (String) docFormatSelector.getSelectedItem();
  }

  public String getSelectedLanguage() {
    return (String) languageSelector.getSelectedItem();
  }

  public JPanel getContent() {
    return myToolWindowContent;
  }
}

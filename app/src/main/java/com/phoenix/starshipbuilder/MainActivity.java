package com.phoenix.starshipbuilder;

import android.app.Activity;
import android.content.Intent;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import java.io.OutputStream;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public final class MainActivity extends Activity {
    private static final int PICK_FILE = 210;
    private WebView webView;
    private ValueCallback<Uri[]> chosenFiles;
    private final ConcurrentHashMap<String, OutputStream> openFiles = new ConcurrentHashMap<>();

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        webView.setBackgroundColor(0xff0d1a27);
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setDefaultTextEncodingName("UTF-8");
        settings.setSupportZoom(false);
        webView.addJavascriptInterface(new SaveBridge(), "PhoenixNative");
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (chosenFiles != null) chosenFiles.onReceiveValue(null);
                chosenFiles = callback;
                try {
                    Intent pick = params.createIntent();
                    pick.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(pick, PICK_FILE);
                    return true;
                } catch (Exception e) {
                    chosenFiles = null;
                    callback.onReceiveValue(null);
                    return false;
                }
            }
        });
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override protected void onActivityResult(int request, int result, Intent intent) {
        super.onActivityResult(request, result, intent);
        if (request != PICK_FILE || chosenFiles == null) return;
        Uri[] data = WebChromeClient.FileChooserParams.parseResult(result, intent);
        chosenFiles.onReceiveValue(data);
        chosenFiles = null;
    }

    private final class SaveBridge {
        @JavascriptInterface public String beginFile(String fileName, String mime) {
            String safe = (fileName == null ? "PhoenixShip.bin" : fileName).replaceAll("[^a-zA-Z0-9._-]", "_");
            if (safe.isEmpty()) safe = "PhoenixShip.bin";
            try {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, safe);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mime == null ? "application/octet-stream" : mime);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/PhoenixStarshipBuilder");
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return "";
                OutputStream out = getContentResolver().openOutputStream(uri);
                if (out == null) return "";
                String token = UUID.randomUUID().toString();
                openFiles.put(token, out);
                return token;
            } catch (Exception e) { return ""; }
        }

        @JavascriptInterface public boolean appendChunk(String token, String base64Chunk) {
            OutputStream out = openFiles.get(token);
            if (out == null) return false;
            try {
                byte[] data = Base64.decode(base64Chunk, Base64.DEFAULT);
                out.write(data);
                return true;
            } catch (Exception e) { return false; }
        }

        @JavascriptInterface public boolean finishFile(String token) {
            OutputStream out = openFiles.remove(token);
            if (out == null) return false;
            try {
                out.flush();
                out.close();
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Файл сохранён в Downloads/PhoenixStarshipBuilder", Toast.LENGTH_LONG).show());
                return true;
            } catch (Exception e) { return false; }
        }

        @JavascriptInterface public void abortFile(String token) {
            OutputStream out = openFiles.remove(token);
            if (out != null) try { out.close(); } catch (Exception ignored) {}
        }
    }

    @Override protected void onDestroy() {
        for (OutputStream out : openFiles.values()) try { out.close(); } catch (Exception ignored) {}
        openFiles.clear();
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}

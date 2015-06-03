package org.apache.cordova.oauthredirect;

import java.util.Map.Entry;
import java.util.Properties;
import java.io.IOException;

import android.util.Log;

import fi.iki.elonen.NanoHTTPD;

public class WebServer extends NanoHTTPD {

  public WebServer(int port) throws IOException {
    super(port);
    Log.i("!!!", "!!!");
  }

  @Override
  public Response serve(IHTTPSession session) {
    /**
    final StringBuilder buf = new StringBuilder();

    for (Entry<Object, Object> kv : header.entrySet()) {
      buf.append(kv.getKey() + " : " + kv.getValue() + "\n");
    }

    handler.post(new Runnable() {
      @Override
      public void run() {
        hello.setText(buf);
      }
    });
    **/

    final String html = "<html><head><head><body><h1>Hello, World</h1></body></html>";
    return this.newFixedLengthResponse(html);
  }
}

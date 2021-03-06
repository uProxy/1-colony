package org.apache.cordova.oauthredirect;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import android.util.Log;
import android.content.Intent;

/**
* This class echoes a string called from JavaScript.
*/
public class OAuthRedirect extends CordovaPlugin {
  private static final int PORT = 10101;
  private WebServer server;

  @Override
  protected void pluginInitialize() {
    try {
      server = new WebServer(PORT); // Digital ocean
      Intent intent = this.cordova.getActivity().getIntent();
      if (intent.getData() == null) {
        //Log.e("helloworld", "null intent");
      } else {
        //this.cordova.getActivity().finish();
        server.setCode(intent.getData().toString());
      }

    } catch(IOException e) {
      Log.e(this.getClass().getName(), e.getMessage());
    }
  }

  @Override
  public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
    if (action.equals("echo")) {
      String message = args.getString(0);
      this.echo(message, callbackContext);
      return true;
    } else if (action.equals("startListening")) {
      this.startListening(callbackContext);
    } else if (action.equals("stopListening")) {
      this.stopListening(callbackContext);
    } else if (action.equals("getCode")) {
      this.getCode(callbackContext);
    }
    return false;
  }

  private void echo(String message, CallbackContext callbackContext) {
    if (message != null && message.length() > 0) {
      callbackContext.success(message);
    } else {
      callbackContext.error("Expected one non-empty string argument.");
    }
  }

  private void startListening(CallbackContext callbackContext) {
    try {
      server.start();
      callbackContext.success();
    } catch(IOException e) {
      Log.e(this.getClass().getName(), e.getMessage());
      callbackContext.error(e.getMessage());
    }
  }
  
  private void stopListening(CallbackContext callbackContext) {
    server.stop();
    callbackContext.success();
  }

  private void getCode(CallbackContext callbackContext) {
    String code = server.getCode();
    if (code == null) {
      callbackContext.error("Server hasn't received any oAuth codes");
    } else {
      callbackContext.success(server.getCode());
    }
  }
}


package io.github.drtumorface.jamesladder;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Draw under the status and gesture bars; the page keeps its controls
        // clear of them with its safe-area padding (Capacitor 8 recommends this).
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}

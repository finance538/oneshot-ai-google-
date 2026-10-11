package com.example.oneshot

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.oneshot.ui.OneShotApp
import com.example.oneshot.ui.theme.OneShotTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            OneShotTheme {
                OneShotApp()
            }
        }
    }
}

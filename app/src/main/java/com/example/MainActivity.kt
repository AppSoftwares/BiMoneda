package com.example

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.ui.components.AppBottomNav
import com.example.ui.components.NavScreen
import com.example.ui.screens.clients.ClientsScreen
import com.example.ui.screens.clients.RegisterClientScreen
import com.example.ui.screens.home.HomeScreen
import com.example.ui.screens.invoices.GenerateInvoiceScreen
import com.example.ui.screens.invoices.InvoicePreviewScreen
import com.example.ui.screens.invoices.InvoicesScreen
import com.example.ui.screens.settings.SettingsScreen
import com.example.ui.theme.FacturaProTheme
import com.example.ui.viewmodel.FacturaViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: FacturaViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val companyProfile by viewModel.companyProfile.collectAsStateWithLifecycle()
            val isDarkMode = companyProfile?.isDarkMode ?: false

            FacturaProTheme(darkTheme = isDarkMode) {
                FacturaApp(viewModel = viewModel)
            }
        }
    }
}

@Composable
fun FacturaApp(viewModel: FacturaViewModel) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val context = LocalContext.current
    val toastMessage by viewModel.toastMessage.collectAsStateWithLifecycle()
    val selectedInvoice by viewModel.selectedInvoice.collectAsStateWithLifecycle()

    LaunchedEffect(toastMessage) {
        toastMessage?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
            viewModel.clearToast()
        }
    }

    val currentScreen = when (currentRoute) {
        "home" -> NavScreen.HOME
        "invoices" -> NavScreen.INVOICES
        "clients" -> NavScreen.CLIENTS
        "settings" -> NavScreen.SETTINGS
        else -> NavScreen.HOME
    }

    val showBottomBar = currentRoute in listOf("home", "invoices", "clients", "settings")

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                AppBottomNav(
                    currentScreen = currentScreen,
                    onNavigate = { screen ->
                        when (screen) {
                            NavScreen.HOME -> navController.navigate("home") {
                                popUpTo("home") { inclusive = true }
                            }
                            NavScreen.INVOICES -> navController.navigate("invoices") {
                                launchSingleTop = true
                            }
                            NavScreen.CLIENTS -> navController.navigate("clients") {
                                launchSingleTop = true
                            }
                            NavScreen.SETTINGS -> navController.navigate("settings") {
                                launchSingleTop = true
                            }
                        }
                    }
                )
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(innerPadding)
        ) {
            // Tab 1: Home / Provider Dashboard
            composable("home") {
                HomeScreen(
                    viewModel = viewModel,
                    onCreateInvoiceClick = { navController.navigate("create_invoice") },
                    onInvoiceClick = { invoice ->
                        viewModel.selectInvoice(invoice)
                        navController.navigate("invoice_preview")
                    },
                    onProfileClick = { navController.navigate("settings") },
                    onViewAllInvoicesClick = { navController.navigate("invoices") }
                )
            }

            // Tab 2: Invoices Screen
            composable("invoices") {
                InvoicesScreen(
                    viewModel = viewModel,
                    onInvoiceClick = { invoice ->
                        viewModel.selectInvoice(invoice)
                        navController.navigate("invoice_preview")
                    },
                    onCreateInvoiceClick = { navController.navigate("create_invoice") }
                )
            }

            // Tab 3: Clients Screen
            composable("clients") {
                ClientsScreen(
                    viewModel = viewModel,
                    onRegisterClientClick = { navController.navigate("register_client") }
                )
            }

            // Tab 4: Settings Screen
            composable("settings") {
                SettingsScreen(viewModel = viewModel)
            }

            // Flow: Create New Invoice
            composable("create_invoice") {
                GenerateInvoiceScreen(
                    viewModel = viewModel,
                    onBackClick = { navController.popBackStack() },
                    onInvoiceCreated = { invoice ->
                        viewModel.selectInvoice(invoice)
                        navController.navigate("invoice_preview") {
                            popUpTo("home")
                        }
                    },
                    onAddNewClientClick = { navController.navigate("register_client") }
                )
            }

            // Flow: Invoice Preview (Legal SENIAT Layout)
            composable("invoice_preview") {
                selectedInvoice?.let { invoice ->
                    InvoicePreviewScreen(
                        invoice = invoice,
                        viewModel = viewModel,
                        onBackClick = { navController.popBackStack() }
                    )
                } ?: run {
                    LaunchedEffect(Unit) {
                        navController.popBackStack()
                    }
                }
            }

            // Flow: Register Client
            composable("register_client") {
                RegisterClientScreen(
                    viewModel = viewModel,
                    onCancelClick = { navController.popBackStack() },
                    onClientRegistered = { navController.popBackStack() }
                )
            }
        }
    }
}

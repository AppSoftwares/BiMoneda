package com.example.ui.screens.clients

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.FacturaPrimary
import com.example.ui.viewmodel.FacturaViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterClientScreen(
    viewModel: FacturaViewModel,
    onCancelClick: () -> Unit,
    onClientRegistered: () -> Unit,
    modifier: Modifier = Modifier
) {
    var fullName by remember { mutableStateOf("") }
    var rif by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var isFreeTrial by remember { mutableStateOf(false) }

    var fullNameError by remember { mutableStateOf(false) }
    var rifError by remember { mutableStateOf(false) }

    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Register New Client",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = FacturaPrimary
                    )
                },
                navigationIcon = {
                    TextButton(
                        onClick = onCancelClick,
                        modifier = Modifier.testTag("register_client_cancel_button")
                    ) {
                        Text(
                            text = "Cancel",
                            color = Color(0xFFB48618), // Warm gold / brown color from Screen 1
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 16.sp
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
        modifier = modifier
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(scrollState)
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Full Name / Company Name
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Full Name / Company Name",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = FacturaPrimary
                )
                OutlinedTextField(
                    value = fullName,
                    onValueChange = {
                        fullName = it
                        fullNameError = false
                    },
                    placeholder = { Text("Ej. PIRELA ESPEJO JESUS ENRIQUE ó Acme Corp") },
                    isError = fullNameError,
                    supportingText = if (fullNameError) {
                        { Text("Por favor ingrese el nombre del cliente") }
                    } else null,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("client_name_input")
                )
            }

            // 2. RIF (Tax ID)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "RIF (Tax ID)",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = FacturaPrimary
                )
                OutlinedTextField(
                    value = rif,
                    onValueChange = {
                        rif = it
                        rifError = false
                    },
                    placeholder = { Text("V-12345678-9 / J-304554141") },
                    isError = rifError,
                    supportingText = if (rifError) {
                        { Text("Por favor ingrese el RIF o Cédula") }
                    } else null,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("client_rif_input")
                )
            }

            // 3. Email
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Email",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = FacturaPrimary
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = { Text("cliente@empresa.com") },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("client_email_input")
                )
            }

            // 4. Phone
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Phone",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = FacturaPrimary
                )
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    placeholder = { Text("0414-9665870 / 0212-9524165") },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("client_phone_input")
                )
            }

            // 5. Fiscal Address
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Domicilio Fiscal (Dirección)",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = FacturaPrimary
                )
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    placeholder = { Text("Av. Principal, Edificio, Ciudad, Estado") },
                    maxLines = 3,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("client_address_input")
                )
            }

            // 6. Free Trial Toggle Card (Pixel-perfect matching Screen 1)
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp, brush = androidx.compose.ui.graphics.SolidColor(Color(0xFFE2E8F0))),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Enable 1-Month Free Trial",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFF1E293B)
                        )
                        Switch(
                            checked = isFreeTrial,
                            onCheckedChange = { isFreeTrial = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = Color(0xFF22C55E)
                            ),
                            modifier = Modifier.testTag("free_trial_switch")
                        )
                    }

                    Text(
                        text = "Enjoy all features. No credit card required. Non-binding trial.",
                        fontSize = 12.sp,
                        color = Color(0xFFB48618), // Warm gold text from Screen 1
                        lineHeight = 16.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 7. Register Client Action Button (Gradient pill from Screen 1)
            val gradientBrush = Brush.horizontalGradient(
                colors = listOf(Color(0xFF388E3C), Color(0xFFB48618))
            )

            Button(
                onClick = {
                    if (fullName.isBlank()) {
                        fullNameError = true
                        return@Button
                    }
                    if (rif.isBlank()) {
                        rifError = true
                        return@Button
                    }

                    viewModel.createClient(
                        fullName = fullName,
                        rif = rif,
                        email = email.ifBlank { "cliente@ejemplo.com" },
                        phone = phone.ifBlank { "0414-0000000" },
                        address = address.ifBlank { "Caracas, Venezuela" },
                        isFreeTrial = isFreeTrial,
                        onSuccess = {
                            onClientRegistered()
                        }
                    )
                },
                shape = RoundedCornerShape(24.dp),
                colors = ButtonDefaults.buttonColors(containerColor = FacturaPrimary),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("register_client_submit_button")
            ) {
                Text(
                    text = "Register Client",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }
    }
}

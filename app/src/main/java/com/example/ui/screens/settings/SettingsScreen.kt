package com.example.ui.screens.settings

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Create
import androidx.compose.material.icons.filled.CurrencyExchange
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Draw
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Token
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.components.SignaturePadDialog
import com.example.ui.theme.FacturaOutlineVariant
import com.example.ui.theme.FacturaPrimary
import com.example.ui.theme.FacturaSecondary
import com.example.ui.theme.FacturaSurfaceContainerLow
import com.example.ui.viewmodel.FacturaViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: FacturaViewModel,
    modifier: Modifier = Modifier
) {
    val profile by viewModel.companyProfile.collectAsStateWithLifecycle()

    var showSignatureDialog by remember { mutableStateOf(false) }

    // Form fields
    var companyName by remember(profile) { mutableStateOf(profile?.companyName ?: "MERCOSUR CASA DE BOLSA S.A") }
    var slogan by remember(profile) { mutableStateOf(profile?.slogan ?: "TU CASA DE BOLSA") }
    var rif by remember(profile) { mutableStateOf(profile?.rif ?: "J-304554141") }
    var address by remember(profile) { mutableStateOf(profile?.address ?: "AV VENEZUELA CON CALLE MOHEDANO EDIF TORRE JWM PISO SEIS (06) OF 1 URB EL ROSAL CARACAS (CHACAO) MIRANDA ZONA POSTAL 1060") }
    var phone by remember(profile) { mutableStateOf(profile?.phone ?: "0212 952 41 65") }
    var email by remember(profile) { mutableStateOf(profile?.email ?: "negocios@mercosur.com.ve") }
    var bcvRateText by remember(profile) { mutableStateOf((profile?.bcvRate ?: 474.0598).toString()) }
    var signatureHolder by remember(profile) { mutableStateOf(profile?.signatureName ?: "Elena Petrova") }

    var isDarkMode by remember(profile) { mutableStateOf(profile?.isDarkMode ?: false) }
    var selectedLanguage by remember(profile) { mutableStateOf(profile?.language ?: "Spanish") }

    if (showSignatureDialog) {
        SignaturePadDialog(
            initialName = signatureHolder,
            onDismiss = { showSignatureDialog = false },
            onSave = { newName ->
                signatureHolder = newName
                showSignatureDialog = false
                val rate = bcvRateText.toDoubleOrNull() ?: 474.0598
                viewModel.updateCompanyProfile(
                    companyName = companyName,
                    slogan = slogan,
                    rif = rif,
                    address = address,
                    phone = phone,
                    email = email,
                    bcvRate = rate,
                    signatureName = newName
                )
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "App Settings",
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = FacturaPrimary
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
        modifier = modifier
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(bottom = 32.dp)
        ) {
            // 1. App Settings Card (Matching Screen 7)
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(width = 1.dp, brush = androidx.compose.ui.graphics.SolidColor(FacturaOutlineVariant.copy(alpha = 0.4f))),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Text(
                            text = "Configuración del Sistema",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = FacturaPrimary
                        )

                        // Appearance Selector
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = "Appearance",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = FacturaPrimary
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                ToggleButtonOption(
                                    text = "Light Mode",
                                    icon = Icons.Default.LightMode,
                                    isSelected = !isDarkMode,
                                    onClick = {
                                        isDarkMode = false
                                        viewModel.updateAppearance(false)
                                    },
                                    modifier = Modifier.weight(1f)
                                )
                                ToggleButtonOption(
                                    text = "Dark Mode",
                                    icon = Icons.Default.DarkMode,
                                    isSelected = isDarkMode,
                                    onClick = {
                                        isDarkMode = true
                                        viewModel.updateAppearance(true)
                                    },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }

                        // Language Selector
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = "Language",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = FacturaPrimary
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                ToggleButtonOption(
                                    text = "Spanish",
                                    icon = Icons.Default.Language,
                                    isSelected = selectedLanguage == "Spanish",
                                    onClick = {
                                        selectedLanguage = "Spanish"
                                        viewModel.updateLanguage("Spanish")
                                    },
                                    modifier = Modifier.weight(1f)
                                )
                                ToggleButtonOption(
                                    text = "English",
                                    icon = Icons.Default.Language,
                                    isSelected = selectedLanguage == "English",
                                    onClick = {
                                        selectedLanguage = "English"
                                        viewModel.updateLanguage("English")
                                    },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }

                        // BCV Official Rate Configuration
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = "Tasa Oficial Banco Central de Venezuela (BCV)",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = FacturaPrimary
                            )
                            OutlinedTextField(
                                value = bcvRateText,
                                onValueChange = { bcvRateText = it },
                                label = { Text("Tasa de Cambio (Bs / USD)") },
                                leadingIcon = {
                                    Icon(
                                        imageVector = Icons.Default.CurrencyExchange,
                                        contentDescription = null,
                                        tint = FacturaSecondary
                                    )
                                },
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("settings_bcv_input")
                            )
                        }
                    }
                }
            }

            // 2. Company Profile Card (Matching Screen 7 & 10)
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(width = 1.dp, brush = androidx.compose.ui.graphics.SolidColor(FacturaOutlineVariant.copy(alpha = 0.4f))),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Company Profile (Datos Fiscales)",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = FacturaPrimary
                        )

                        OutlinedTextField(
                            value = companyName,
                            onValueChange = { companyName = it },
                            label = { Text("Razón Social de la Empresa") },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("settings_company_name")
                        )

                        OutlinedTextField(
                            value = slogan,
                            onValueChange = { slogan = it },
                            label = { Text("Slogan o Denominación Comercial") },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = rif,
                            onValueChange = { rif = it },
                            label = { Text("RIF (Registro de Información Fiscal)") },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("settings_company_rif")
                        )

                        OutlinedTextField(
                            value = address,
                            onValueChange = { address = it },
                            label = { Text("Domicilio Fiscal Completo") },
                            maxLines = 3,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            OutlinedTextField(
                                value = phone,
                                onValueChange = { phone = it },
                                label = { Text("Teléfono") },
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = email,
                                onValueChange = { email = it },
                                label = { Text("Correo Electrónico") },
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Button(
                            onClick = {
                                val rate = bcvRateText.toDoubleOrNull() ?: 474.0598
                                viewModel.updateCompanyProfile(
                                    companyName = companyName,
                                    slogan = slogan,
                                    rif = rif,
                                    address = address,
                                    phone = phone,
                                    email = email,
                                    bcvRate = rate,
                                    signatureName = signatureHolder
                                )
                            },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = FacturaPrimary),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .testTag("save_company_profile_button")
                        ) {
                            Icon(imageVector = Icons.Default.Save, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Guardar Cambios Fiscales", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // 3. Digital Signature Card (Matching Screen 7 & 10)
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = CardDefaults.outlinedCardBorder().copy(width = 1.dp, brush = androidx.compose.ui.graphics.SolidColor(FacturaOutlineVariant.copy(alpha = 0.4f))),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Digital Signature (Firma Digital Autorizada)",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = FacturaPrimary
                        )

                        Text(
                            text = "Firma digital estampada en los comprobantes fiscales y contratos de suscripción válidos ante el SENIAT.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        // Signature display card
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(100.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(FacturaSurfaceContainerLow)
                                .border(1.dp, FacturaOutlineVariant.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                                .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = signatureHolder,
                                    fontFamily = FontFamily.Cursive,
                                    fontSize = 28.sp,
                                    fontStyle = FontStyle.Italic,
                                    color = FacturaPrimary,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = "Representante Legal Autorizado",
                                    fontSize = 10.sp,
                                    color = Color(0xFF64748B)
                                )
                            }
                        }

                        Button(
                            onClick = { showSignatureDialog = true },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = FacturaSecondary),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                                .testTag("upload_signature_button")
                        ) {
                            Icon(imageVector = Icons.Default.Draw, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Subir / Dibujar Firma Digital",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ToggleButtonOption(
    text: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(if (isSelected) FacturaPrimary else Color(0xFFF1F5F9))
            .border(
                1.dp,
                if (isSelected) FacturaPrimary else Color(0xFFCBD5E1),
                RoundedCornerShape(10.dp)
            )
            .clickable { onClick() }
            .padding(vertical = 10.dp, horizontal = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = text,
                tint = if (isSelected) Color.White else Color(0xFF334155),
                modifier = Modifier.size(18.dp)
            )
            Text(
                text = text,
                fontSize = 13.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = if (isSelected) Color.White else Color(0xFF334155)
            )
        }
    }
}

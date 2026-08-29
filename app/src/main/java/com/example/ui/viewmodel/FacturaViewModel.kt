package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.db.AppDatabase
import com.example.data.entity.ClientEntity
import com.example.data.entity.CompanyProfileEntity
import com.example.data.entity.InvoiceEntity
import com.example.data.repository.FacturaRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class DashboardUiState(
    val totalRevenueUsd: Double = 4500.0,
    val totalRevenueBs: Double = 162000000.0,
    val activeSubscriptionsCount: Int = 312,
    val pendingPaymentsCount: Int = 24,
    val bcvRate: Double = 474.0598,
    val recentInvoices: List<InvoiceEntity> = emptyList(),
    val allInvoices: List<InvoiceEntity> = emptyList(),
    val clients: List<ClientEntity> = emptyList(),
    val companyProfile: CompanyProfileEntity? = null
)

class FacturaViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: FacturaRepository

    val clients: StateFlow<List<ClientEntity>>
    val allInvoices: StateFlow<List<InvoiceEntity>>
    val recentInvoices: StateFlow<List<InvoiceEntity>>
    val companyProfile: StateFlow<CompanyProfileEntity?>

    private val _selectedInvoice = MutableStateFlow<InvoiceEntity?>(null)
    val selectedInvoice: StateFlow<InvoiceEntity?> = _selectedInvoice.asStateFlow()

    private val _toastMessage = MutableStateFlow<String?>(null)
    val toastMessage: StateFlow<String?> = _toastMessage.asStateFlow()

    init {
        val db = AppDatabase.getInstance(application)
        repository = FacturaRepository(
            db.clientDao(),
            db.invoiceDao(),
            db.companyProfileDao()
        )

        clients = repository.allClients.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            emptyList()
        )

        allInvoices = repository.allInvoices.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            emptyList()
        )

        recentInvoices = repository.recentInvoices.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            emptyList()
        )

        companyProfile = repository.companyProfile.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            null
        )
    }

    val dashboardState: StateFlow<DashboardUiState> = combine(
        allInvoices,
        clients,
        companyProfile
    ) { invoices, clientList, profile ->
        val paidInvoices = invoices.filter { it.status == "PAID" }
        val pendingCount = invoices.count { it.status == "PENDING" }
        val activeClients = clientList.count { it.status == "ACTIVE" || it.status == "TRIAL" }
        val currentBcv = profile?.bcvRate ?: 474.0598

        val totalUsd = if (paidInvoices.isNotEmpty()) {
            paidInvoices.sumOf { it.totalUsd }
        } else {
            4500.00
        }

        val totalBs = if (paidInvoices.isNotEmpty()) {
            paidInvoices.sumOf { it.totalBs }
        } else {
            totalUsd * currentBcv
        }

        DashboardUiState(
            totalRevenueUsd = totalUsd,
            totalRevenueBs = totalBs,
            activeSubscriptionsCount = if (activeClients > 0) activeClients else 312,
            pendingPaymentsCount = pendingCount,
            bcvRate = currentBcv,
            recentInvoices = invoices.take(6),
            allInvoices = invoices,
            clients = clientList,
            companyProfile = profile
        )
    }.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        DashboardUiState()
    )

    fun selectInvoice(invoice: InvoiceEntity?) {
        _selectedInvoice.value = invoice
    }

    fun clearToast() {
        _toastMessage.value = null
    }

    fun createClient(
        fullName: String,
        rif: String,
        email: String,
        phone: String,
        address: String,
        isFreeTrial: Boolean,
        planName: String = "Software Subscription",
        monthlyPriceUsd: Double = 100.0,
        onSuccess: (Long) -> Unit = {}
    ) {
        viewModelScope.launch {
            val status = if (isFreeTrial) "TRIAL" else "ACTIVE"
            val newClient = ClientEntity(
                fullName = fullName.trim(),
                rif = rif.trim().uppercase(),
                email = email.trim(),
                phone = phone.trim(),
                address = address.trim(),
                isFreeTrial = isFreeTrial,
                status = status,
                planName = planName,
                monthlyPriceUsd = monthlyPriceUsd
            )
            val id = repository.insertClient(newClient)
            _toastMessage.value = "Cliente ${newClient.fullName} registrado con éxito"
            onSuccess(id)
        }
    }

    fun updateClient(client: ClientEntity) {
        viewModelScope.launch {
            repository.updateClient(client)
            _toastMessage.value = "Cliente actualizado"
        }
    }

    fun deleteClient(client: ClientEntity) {
        viewModelScope.launch {
            repository.deleteClient(client)
            _toastMessage.value = "Cliente eliminado"
        }
    }

    fun generateInvoice(
        client: ClientEntity,
        concept: String,
        amountUsd: Double,
        paymentMethod: String,
        referenceNumber: String,
        applyIgtf: Boolean = false,
        customBcvRate: Double? = null,
        onSuccess: (InvoiceEntity) -> Unit
    ) {
        viewModelScope.launch {
            val profile = repository.getCompanyProfileDirect()
            val bcvRate = customBcvRate ?: (profile?.bcvRate ?: 474.0598)

            val nextNumber = (108990 + (allInvoices.value.size + 1)).toString()
            val nextControl = "00-" + (110368 + (allInvoices.value.size + 1)).toString()

            val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
            val timeFormat = SimpleDateFormat("hh:mm:ss a", Locale.getDefault())
            val now = Date()

            // Subtotal, IVA (16%), and IGTF (3% if USD cash/divisa)
            val subtotalUsd = amountUsd
            val subtotalBs = subtotalUsd * bcvRate

            val taxableBaseUsd = subtotalUsd
            val taxableBaseBs = subtotalBs

            val ivaUsd = taxableBaseUsd * 0.16
            val ivaBs = taxableBaseBs * 0.16

            val igtfUsd = if (applyIgtf) taxableBaseUsd * 0.03 else 0.0
            val igtfBs = if (applyIgtf) taxableBaseBs * 0.03 else 0.0

            val totalUsd = taxableBaseUsd + ivaUsd + igtfUsd
            val totalBs = taxableBaseBs + ivaBs + igtfBs

            val invoice = InvoiceEntity(
                invoiceNumber = nextNumber,
                controlNumber = nextControl,
                clientId = client.id,
                clientName = client.fullName,
                clientRif = client.rif,
                clientAddress = client.address.ifEmpty { "AVENIDA DON BELLOS CHACIN, VIA AL AEROPUERTO, MARACAIBO" },
                clientPhone = client.phone,
                issueDate = dateFormat.format(now),
                issueTime = timeFormat.format(now).lowercase(),
                concept = concept.ifEmpty { "${client.planName} - Facturación Digital" },
                serviceCode = "IS0071",
                serviceUnit = "UNIDAD",
                quantity = 1,
                bcvRate = bcvRate,
                subtotalUsd = subtotalUsd,
                subtotalBs = subtotalBs,
                exemptUsd = 0.0,
                exemptBs = 0.0,
                taxableBaseUsd = taxableBaseUsd,
                taxableBaseBs = taxableBaseBs,
                ivaRatePercent = 16.0,
                ivaUsd = ivaUsd,
                ivaBs = ivaBs,
                igtfRatePercent = if (applyIgtf) 3.0 else 0.0,
                igtfUsd = igtfUsd,
                igtfBs = igtfBs,
                totalUsd = totalUsd,
                totalBs = totalBs,
                paymentMethod = paymentMethod,
                referenceNumber = referenceNumber,
                status = "PAID",
                paymentCondition = "CONTADO",
                saleType = "INTERNA",
                observations = "Comisiones Varias - Suscripción Activa"
            )

            val id = repository.insertInvoice(invoice)
            val savedInvoice = invoice.copy(id = id)
            _selectedInvoice.value = savedInvoice
            _toastMessage.value = "Factura #$nextNumber generada exitosamente"
            onSuccess(savedInvoice)
        }
    }

    fun toggleInvoiceStatus(invoice: InvoiceEntity) {
        viewModelScope.launch {
            val updatedStatus = if (invoice.status == "PAID") "PENDING" else "PAID"
            val updated = invoice.copy(status = updatedStatus)
            repository.updateInvoice(updated)
            if (_selectedInvoice.value?.id == invoice.id) {
                _selectedInvoice.value = updated
            }
            _toastMessage.value = "Factura marcada como $updatedStatus"
        }
    }

    fun updateCompanyProfile(
        companyName: String,
        slogan: String,
        rif: String,
        address: String,
        phone: String,
        email: String,
        bcvRate: Double,
        signatureName: String
    ) {
        viewModelScope.launch {
            val current = repository.getCompanyProfileDirect() ?: CompanyProfileEntity()
            val updated = current.copy(
                companyName = companyName.trim(),
                slogan = slogan.trim(),
                rif = rif.trim(),
                address = address.trim(),
                phone = phone.trim(),
                email = email.trim(),
                bcvRate = bcvRate,
                signatureName = signatureName.trim()
            )
            repository.updateCompanyProfile(updated)
            _toastMessage.value = "Perfil de empresa y tasa BCV actualizados"
        }
    }

    fun updateAppearance(isDark: Boolean) {
        viewModelScope.launch {
            val current = repository.getCompanyProfileDirect() ?: CompanyProfileEntity()
            repository.updateCompanyProfile(current.copy(isDarkMode = isDark))
        }
    }

    fun updateLanguage(lang: String) {
        viewModelScope.launch {
            val current = repository.getCompanyProfileDirect() ?: CompanyProfileEntity()
            repository.updateCompanyProfile(current.copy(language = lang))
            _toastMessage.value = "Idioma configurado: $lang"
        }
    }

    companion object {
        fun formatUsd(amount: Double): String {
            val symbols = DecimalFormatSymbols(Locale.US)
            val formatter = DecimalFormat("$#,##0.00", symbols)
            return formatter.format(amount)
        }

        fun formatBs(amount: Double): String {
            val symbols = DecimalFormatSymbols(Locale("es", "VE")).apply {
                groupingSeparator = '.'
                decimalSeparator = ','
            }
            val formatter = DecimalFormat("Bs #,##0.00", symbols)
            return formatter.format(amount)
        }

        fun formatBcv(rate: Double): String {
            val symbols = DecimalFormatSymbols(Locale("es", "VE")).apply {
                groupingSeparator = '.'
                decimalSeparator = ','
            }
            val formatter = DecimalFormat("#,##0.0000", symbols)
            return formatter.format(rate)
        }
    }
}

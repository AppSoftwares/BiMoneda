package com.example.data.repository

import com.example.data.dao.ClientDao
import com.example.data.dao.CompanyProfileDao
import com.example.data.dao.InvoiceDao
import com.example.data.entity.ClientEntity
import com.example.data.entity.CompanyProfileEntity
import com.example.data.entity.InvoiceEntity
import kotlinx.coroutines.flow.Flow

class FacturaRepository(
    private val clientDao: ClientDao,
    private val invoiceDao: InvoiceDao,
    private val companyProfileDao: CompanyProfileDao
) {
    // Clients
    val allClients: Flow<List<ClientEntity>> = clientDao.getAllClients()
    val clientCount: Flow<Int> = clientDao.getClientCount()
    val trialClientCount: Flow<Int> = clientDao.getTrialClientCount()

    suspend fun getClientById(id: Long): ClientEntity? = clientDao.getClientById(id)
    suspend fun insertClient(client: ClientEntity): Long = clientDao.insertClient(client)
    suspend fun updateClient(client: ClientEntity) = clientDao.updateClient(client)
    suspend fun deleteClient(client: ClientEntity) = clientDao.deleteClient(client)

    // Invoices
    val allInvoices: Flow<List<InvoiceEntity>> = invoiceDao.getAllInvoices()
    val recentInvoices: Flow<List<InvoiceEntity>> = invoiceDao.getRecentInvoices(10)
    val pendingInvoiceCount: Flow<Int> = invoiceDao.getPendingInvoiceCount()
    val totalInvoiceCount: Flow<Int> = invoiceDao.getTotalInvoiceCount()
    val totalEarnedUsd: Flow<Double?> = invoiceDao.getTotalEarnedUsd()
    val totalEarnedBs: Flow<Double?> = invoiceDao.getTotalEarnedBs()

    suspend fun getInvoiceById(id: Long): InvoiceEntity? = invoiceDao.getInvoiceById(id)
    suspend fun insertInvoice(invoice: InvoiceEntity): Long = invoiceDao.insertInvoice(invoice)
    suspend fun updateInvoice(invoice: InvoiceEntity) = invoiceDao.updateInvoice(invoice)
    suspend fun deleteInvoice(invoice: InvoiceEntity) = invoiceDao.deleteInvoice(invoice)

    // Company Profile
    val companyProfile: Flow<CompanyProfileEntity?> = companyProfileDao.getCompanyProfile()
    suspend fun getCompanyProfileDirect(): CompanyProfileEntity? = companyProfileDao.getCompanyProfileDirect()
    suspend fun updateCompanyProfile(profile: CompanyProfileEntity) = companyProfileDao.insertOrUpdate(profile)
}

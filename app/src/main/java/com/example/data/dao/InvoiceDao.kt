package com.example.data.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.data.entity.InvoiceEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface InvoiceDao {
    @Query("SELECT * FROM invoices ORDER BY id DESC")
    fun getAllInvoices(): Flow<List<InvoiceEntity>>

    @Query("SELECT * FROM invoices WHERE id = :id LIMIT 1")
    suspend fun getInvoiceById(id: Long): InvoiceEntity?

    @Query("SELECT * FROM invoices ORDER BY id DESC LIMIT :limit")
    fun getRecentInvoices(limit: Int = 5): Flow<List<InvoiceEntity>>

    @Query("SELECT COUNT(*) FROM invoices WHERE status = 'PENDING'")
    fun getPendingInvoiceCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM invoices")
    fun getTotalInvoiceCount(): Flow<Int>

    @Query("SELECT SUM(totalUsd) FROM invoices WHERE status = 'PAID'")
    fun getTotalEarnedUsd(): Flow<Double?>

    @Query("SELECT SUM(totalBs) FROM invoices WHERE status = 'PAID'")
    fun getTotalEarnedBs(): Flow<Double?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInvoice(invoice: InvoiceEntity): Long

    @Update
    suspend fun updateInvoice(invoice: InvoiceEntity)

    @Delete
    suspend fun deleteInvoice(invoice: InvoiceEntity)
}

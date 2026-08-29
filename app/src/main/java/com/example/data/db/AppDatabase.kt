package com.example.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.data.dao.ClientDao
import com.example.data.dao.CompanyProfileDao
import com.example.data.dao.InvoiceDao
import com.example.data.entity.ClientEntity
import com.example.data.entity.CompanyProfileEntity
import com.example.data.entity.InvoiceEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        ClientEntity::class,
        InvoiceEntity::class,
        CompanyProfileEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun clientDao(): ClientDao
    abstract fun invoiceDao(): InvoiceDao
    abstract fun companyProfileDao(): CompanyProfileDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "facturapro_ve.db"
                ).addCallback(object : Callback() {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        super.onCreate(db)
                        // Pre-populate with initial data matching the user's design mockups
                        CoroutineScope(Dispatchers.IO).launch {
                            val database = getInstance(context)
                            prepopulateDatabase(database)
                        }
                    }
                }).build()
                INSTANCE = instance
                instance
            }
        }

        private suspend fun prepopulateDatabase(db: AppDatabase) {
            // Seed Company Profile
            val defaultProfile = CompanyProfileEntity(
                id = 1,
                companyName = "MERCOSUR CASA DE BOLSA S.A",
                slogan = "TU CASA DE BOLSA",
                rif = "J-304554141",
                address = "AV VENEZUELA CON CALLE MOHEDANO EDIF TORRE JWM PISO SEIS (06) OF 1 URB EL ROSAL CARACAS (CHACAO) MIRANDA ZONA POSTAL 1060",
                phone = "0212 952 41 65",
                email = "negocios@mercosur.com.ve",
                economicActivityCode = "9499",
                bcvRate = 474.0598,
                signatureName = "Elena Petrova",
                isDarkMode = false,
                language = "Spanish"
            )
            db.companyProfileDao().insertOrUpdate(defaultProfile)

            // Seed Clients
            val client1Id = db.clientDao().insertClient(
                ClientEntity(
                    fullName = "PIRELA ESPEJO JESUS ENRIQUE",
                    rif = "V-018381533",
                    email = "jess.pirela@gmail.com",
                    phone = "04149665870",
                    address = "AVENIDA DON BELLOS CHACIN, VIA AL AERO PUERTO SEDE PRINCIPAL CICPC MARACAIBO",
                    isFreeTrial = false,
                    status = "ACTIVE",
                    planName = "Software Subscription - Standard",
                    monthlyPriceUsd = 100.0
                )
            )

            val client2Id = db.clientDao().insertClient(
                ClientEntity(
                    fullName = "Acme Corp",
                    rif = "J-298374610",
                    email = "billing@acmecorp.com",
                    phone = "0212 555 12 34",
                    address = "Av. Francisco de Miranda, Torre Cavendes, Piso 8, Chacao",
                    isFreeTrial = false,
                    status = "ACTIVE",
                    planName = "Plan Enterprise Cloud",
                    monthlyPriceUsd = 250.0
                )
            )

            val client3Id = db.clientDao().insertClient(
                ClientEntity(
                    fullName = "VeneSoftware",
                    rif = "J-401928374",
                    email = "finance@venesoftware.ve",
                    phone = "0241 823 44 90",
                    address = "Av. Bolivar Norte, Edif. Torre Camoruco, Valencia, Carabobo",
                    isFreeTrial = true,
                    status = "TRIAL",
                    planName = "Software Subscription - Standard",
                    monthlyPriceUsd = 150.0
                )
            )

            val client4Id = db.clientDao().insertClient(
                ClientEntity(
                    fullName = "TechServices Co",
                    rif = "J-512938475",
                    email = "contact@techservices.com",
                    phone = "0261 792 11 00",
                    address = "Calle 72 con Av. 15 Delicias, Maracaibo, Zulia",
                    isFreeTrial = false,
                    status = "ACTIVE",
                    planName = "Plan Corporativo Plus",
                    monthlyPriceUsd = 400.0
                )
            )

            val client5Id = db.clientDao().insertClient(
                ClientEntity(
                    fullName = "Servicios Tecnológicos CA",
                    rif = "J-30123456-7",
                    email = "info@serviciostecnologicos.com",
                    phone = "0212 999 88 77",
                    address = "Centro San Ignacio, Torre Copernico, Caracas",
                    isFreeTrial = false,
                    status = "ACTIVE",
                    planName = "Software Subscription - Oct",
                    monthlyPriceUsd = 100.0
                )
            )

            // Seed Invoices (matching user dashboard and legal invoice preview screenshots)
            db.invoiceDao().insertInvoice(
                InvoiceEntity(
                    invoiceNumber = "108991",
                    controlNumber = "00-110369",
                    clientId = client1Id,
                    clientName = "PIRELA ESPEJO JESUS ENRIQUE",
                    clientRif = "V-018381533",
                    clientAddress = "AVENIDA DON BELLOS CHACIN, VIA AL AERO PUERTO SEDE PRINCIPAL CICPC MARACAIBO",
                    clientPhone = "04149665870",
                    issueDate = "06/04/2026",
                    issueTime = "04:39:54 p.m.",
                    concept = "Comisiones Varias - Operacion Compra BPV / TPG",
                    serviceCode = "IS0071",
                    serviceUnit = "UNIDAD",
                    quantity = 1,
                    bcvRate = 474.0598,
                    subtotalUsd = 0.96,
                    subtotalBs = 457.20,
                    exemptUsd = 0.00,
                    exemptBs = 0.00,
                    taxableBaseUsd = 0.96,
                    taxableBaseBs = 457.20,
                    ivaRatePercent = 16.0,
                    ivaUsd = 0.15,
                    ivaBs = 73.15,
                    igtfRatePercent = 0.0,
                    igtfUsd = 0.0,
                    igtfBs = 0.0,
                    totalUsd = 1.11,
                    totalBs = 530.35,
                    paymentMethod = "Transfer",
                    referenceNumber = "REF-2026-04-06-8991",
                    status = "PAID",
                    paymentCondition = "CONTADO",
                    saleType = "INTERNA",
                    observations = "Comisiones Varias"
                )
            )

            db.invoiceDao().insertInvoice(
                InvoiceEntity(
                    invoiceNumber = "INV-2023-11-15",
                    controlNumber = "00-109842",
                    clientId = client2Id,
                    clientName = "Acme Corp",
                    clientRif = "J-298374610",
                    clientAddress = "Av. Francisco de Miranda, Torre Cavendes, Piso 8, Chacao",
                    clientPhone = "0212 555 12 34",
                    issueDate = "15/11/2023",
                    issueTime = "10:15:00 a.m.",
                    concept = "Plan Enterprise Cloud - Noviembre 2023",
                    serviceCode = "IS0102",
                    serviceUnit = "UNIDAD",
                    quantity = 1,
                    bcvRate = 36000.00,
                    subtotalUsd = 215.52,
                    subtotalBs = 7758720.00,
                    exemptUsd = 0.0,
                    exemptBs = 0.0,
                    taxableBaseUsd = 215.52,
                    taxableBaseBs = 7758720.00,
                    ivaRatePercent = 16.0,
                    ivaUsd = 34.48,
                    ivaBs = 1241280.00,
                    igtfRatePercent = 0.0,
                    igtfUsd = 0.0,
                    igtfBs = 0.0,
                    totalUsd = 250.00,
                    totalBs = 9000000.00,
                    paymentMethod = "Zelle",
                    referenceNumber = "ZEL-928374",
                    status = "PAID"
                )
            )

            db.invoiceDao().insertInvoice(
                InvoiceEntity(
                    invoiceNumber = "INV-2023-11-14",
                    controlNumber = "00-109841",
                    clientId = client3Id,
                    clientName = "VeneSoftware",
                    clientRif = "J-401928374",
                    clientAddress = "Av. Bolivar Norte, Torre Camoruco, Valencia",
                    clientPhone = "0241 823 44 90",
                    issueDate = "14/11/2023",
                    issueTime = "02:45:10 p.m.",
                    concept = "Software Subscription - Standard",
                    serviceCode = "IS0100",
                    serviceUnit = "UNIDAD",
                    quantity = 1,
                    bcvRate = 36000.00,
                    subtotalUsd = 129.31,
                    subtotalBs = 4655160.00,
                    exemptUsd = 0.0,
                    exemptBs = 0.0,
                    taxableBaseUsd = 129.31,
                    taxableBaseBs = 4655160.00,
                    ivaRatePercent = 16.0,
                    ivaUsd = 20.69,
                    ivaBs = 744840.00,
                    igtfRatePercent = 0.0,
                    igtfUsd = 0.0,
                    igtfBs = 0.0,
                    totalUsd = 150.00,
                    totalBs = 5400000.00,
                    paymentMethod = "Pago Móvil",
                    referenceNumber = "PM-0414-998822",
                    status = "PENDING"
                )
            )

            db.invoiceDao().insertInvoice(
                InvoiceEntity(
                    invoiceNumber = "INV-2023-11-12",
                    controlNumber = "00-109840",
                    clientId = client4Id,
                    clientName = "TechServices Co",
                    clientRif = "J-512938475",
                    clientAddress = "Calle 72 con Av. 15 Delicias, Maracaibo",
                    clientPhone = "0261 792 11 00",
                    issueDate = "12/11/2023",
                    issueTime = "11:30:20 a.m.",
                    concept = "Plan Corporativo Plus - Mantenimiento",
                    serviceCode = "IS0200",
                    serviceUnit = "UNIDAD",
                    quantity = 1,
                    bcvRate = 36000.00,
                    subtotalUsd = 344.83,
                    subtotalBs = 12413880.00,
                    exemptUsd = 0.0,
                    exemptBs = 0.0,
                    taxableBaseUsd = 344.83,
                    taxableBaseBs = 12413880.00,
                    ivaRatePercent = 16.0,
                    ivaUsd = 55.17,
                    ivaBs = 1986120.00,
                    igtfRatePercent = 0.0,
                    igtfUsd = 0.0,
                    igtfBs = 0.0,
                    totalUsd = 400.00,
                    totalBs = 14400000.00,
                    paymentMethod = "Transfer",
                    referenceNumber = "BANCO-MERC-4820",
                    status = "PAID"
                )
            )
        }
    }
}

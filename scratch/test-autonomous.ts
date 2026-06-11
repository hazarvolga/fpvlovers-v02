import { getQueueStatusNew, processNextBatchNew } from '../src/lib/crawl-queue';

async function runTest() {
  console.log("=== OTONOM SİSTEM TESTİ BAŞLIYOR ===");
  
  console.log("\n[1] Kuyruk Durumu Kontrol Ediliyor...");
  try {
    const status = await getQueueStatusNew();
    console.log(JSON.stringify(status, null, 2));
  } catch (err) {
    console.error("Hata (Queue Status):", err);
  }

  console.log("\n[2] Siradaki Crawl Islemleri (Batch) Isleniyor...");
  try {
    await processNextBatchNew();
    console.log("Crawl batch işlemi tamamlandı (Dry-Run modunda olabilir, CRAWL_DRY_RUN kontrol ediliyor).");
  } catch (err) {
    console.error("Hata (Process Batch):", err);
  }

  console.log("\n=== TEST TAMAMLANDI ===");
}

runTest();

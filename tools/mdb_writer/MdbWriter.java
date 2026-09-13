package app.tools;

import com.healthmarketscience.jackcess.Database;
import com.healthmarketscience.jackcess.DatabaseBuilder;
import com.healthmarketscience.jackcess.Table;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * MdbWriter — CLI tool to insert student records into STDNTINFO in an Access .MDB template.
 * Usage: java -jar mdb-writer.jar <template.mdb> <records.tsv> <output.mdb>
 */
public class MdbWriter {
    public static void main(String[] args) {
        if (args.length < 3) {
            System.err.println("Usage: MdbWriter <template.mdb> <records.tsv> <output.mdb>");
            System.exit(1);
        }

        File templateFile = new File(args[0]);
        File tsvFile = new File(args[1]);
        File outputFile = new File(args[2]);

        if (!templateFile.exists()) {
            System.err.println("Template file not found: " + templateFile.getAbsolutePath());
            System.exit(2);
        }

        if (!tsvFile.exists()) {
            System.err.println("TSV records file not found: " + tsvFile.getAbsolutePath());
            System.exit(3);
        }

        try {
            // 1. Copy template to output destination
            if (outputFile.exists()) {
                outputFile.delete();
            }
            Files.copy(templateFile.toPath(), outputFile.toPath());

            // 2. Open output MDB via Jackcess
            try (Database db = new DatabaseBuilder(outputFile).open()) {
                Table table = db.getTable("STDNTINFO");
                if (table == null) {
                    System.err.println("Table STDNTINFO not found in " + outputFile.getAbsolutePath());
                    System.exit(4);
                }

                File baseDir = tsvFile.getParentFile();
                if (baseDir == null) {
                    baseDir = new File(".");
                }

                int count = 0;
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(new FileInputStream(tsvFile), StandardCharsets.UTF_8))) {
                    
                    String line;
                    boolean isHeader = true;
                    while ((line = reader.readLine()) != null) {
                        if (line.trim().isEmpty()) continue;
                        if (isHeader) {
                            // Skip header row
                            isHeader = false;
                            continue;
                        }

                        String[] rawParts = line.split("\t", -1);
                        if (rawParts.length < 10) {
                            System.err.println("[WARN] Skipping line with fewer than 10 columns: " + line);
                            continue;
                        }

                        String[] parts = new String[15];
                        java.util.Arrays.fill(parts, "");
                        for (int i = 0; i < Math.min(rawParts.length, 15); i++) {
                            parts[i] = rawParts[i].trim();
                        }

                        Map<String, Object> row = new HashMap<>();
                        row.put("STUDNO", parts[0]);
                        row.put("LASTNAME", parts[1]);
                        row.put("FRSTNAME", parts[2]);
                        row.put("MDLENAME", parts[3]);
                        row.put("GENDER", parts[4]);
                        row.put("BRTHDATE", parts[5]);
                        row.put("EMAILADR", parts[6]);
                        row.put("PROGCODE", parts[7]);
                        row.put("ACADLEVL", parts[8].isEmpty() ? "50" : parts[8]);
                        row.put("PERMSTRT", parts[9]);
                        row.put("CTCTPRSN", parts[10]);
                        row.put("CTCTNMBR", parts[11]);
                        row.put("CTCTSTRT", parts[12]);

                        String picRelPath = parts[13].trim();
                        if (!picRelPath.isEmpty()) {
                            File picFile = new File(baseDir, picRelPath);
                            if (picFile.exists()) {
                                row.put("PICTURE", Files.readAllBytes(picFile.toPath()));
                            }
                        }

                        String sigRelPath = parts[14].trim();
                        if (!sigRelPath.isEmpty()) {
                            File sigFile = new File(baseDir, sigRelPath);
                            if (sigFile.exists()) {
                                row.put("SIGNATURE", Files.readAllBytes(sigFile.toPath()));
                            }
                        }

                        table.addRowFromMap(row);
                        count++;
                    }
                }

                System.out.println("SUCCESS: Inserted " + count + " records into " + outputFile.getAbsolutePath());
            }

        } catch (Exception e) {
            e.printStackTrace();
            System.exit(5);
        }
    }
}

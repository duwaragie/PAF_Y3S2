package com.smartcampus.api.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Hibernate auto-generates a CHECK constraint on {@code notifications.type} listing the
 * enum values that existed when the table was first created. Adding new values to
 * {@link com.smartcampus.api.model.NotificationType} leaves that constraint stale and
 * inserts fail.
 *
 * ddl-auto=update does not re-sync CHECK constraints on enum columns, so we drop it
 * once on startup. Idempotent — safe to run every boot.
 */
@Slf4j
@Component
@Order(0) // run before DataInitializer
@RequiredArgsConstructor
public class NotificationSchemaFix implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        dropConstraintIfExists("notifications", "notifications_type_check");

        // The preference model changed from per-type rows to a single row per user
        // (email + push toggles; in-app is always on). The old table schema is
        // incompatible — drop it so Hibernate rebuilds with the new shape.
        dropOldPreferenceTableIfShapeChanged();
    }

    private void dropConstraintIfExists(String table, String constraint) {
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE " + table + " DROP CONSTRAINT IF EXISTS " + constraint);
            log.debug("Ensured CHECK constraint {} on {} is removed", constraint, table);
        } catch (Exception e) {
            log.warn("Could not drop {} on {}: {}", constraint, table, e.getMessage());
        }
    }

    private void dropOldPreferenceTableIfShapeChanged() {
        try {
            Integer hasTypeColumn = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns " +
                            "WHERE table_name = 'user_notification_preferences' AND column_name = 'type'",
                    Integer.class);
            if (hasTypeColumn != null && hasTypeColumn > 0) {
                jdbcTemplate.execute("DROP TABLE IF EXISTS user_notification_preferences CASCADE");
                log.info("Dropped legacy user_notification_preferences table for schema migration");
            }
        } catch (Exception e) {
            log.warn("Could not check/drop old preference table: {}", e.getMessage());
        }
    }
}

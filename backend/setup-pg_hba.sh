#!/bin/bash
# This script runs after PostgreSQL initialization to set up pg_hba.conf

# Give time for PostgreSQL to start
sleep 2

# Copy the pg_hba.conf to the data directory
if [ -f "/var/lib/postgresql/pg_hba.conf" ]; then
    cp /var/lib/postgresql/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf
    chmod 600 /var/lib/postgresql/data/pg_hba.conf
fi

# Reload PostgreSQL configuration
su - postgres -c "pg_ctl reload -D /var/lib/postgresql/data" || true

exit 0

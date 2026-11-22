#!/usr/bin/env bash
# Sobe um TiDB local (compatível com MySQL, igual ao banco da Manus) na porta 4000.
# Requer o tiup: https://tiup.io
set -euo pipefail
export PATH="$HOME/.tiup/bin:$PATH"
exec tiup playground --mode tidb --without-monitor --tag fioforma --db.port 4000

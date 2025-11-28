document.addEventListener("DOMContentLoaded", () => {
    loadHistory();
});

async function loadHistory() {
    const tableBody = document.querySelector("#historyTable tbody");
    tableBody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;

    try {
        const res = await fetch("/api/file-movement");
        if (!res.ok) throw new Error("Failed to fetch history");

        const data = await res.json();
        tableBody.innerHTML = "";

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6">No history found.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const row = document.createElement("tr");

            // Files list
            const fileList = item.files?.map(f => f.file_name).join(", ") || "-";

            // Status badge UI
            const statusBadge = getStatusBadge(item.status_id, item.status_name);

            row.innerHTML = `
                <td>${item.move_id}</td>
                <td>${item.move_type}</td>
                <td>${formatDate(item.move_date)}</td>
                <td>${fileList}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="view-btn" onclick="viewMovement(${item.move_id})">
                        View
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="6">Error loading history</td></tr>`;
    }
}

function viewMovement(moveId) {
    // open individual movement view page
    window.location.href = `/movement_view.html?move_id=${moveId}`;
}

/* ------------------------------------------
   Helper: Format Date
------------------------------------------- */
function formatDate(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

/* ------------------------------------------
   Helper: Status Badge
------------------------------------------- */
function getStatusBadge(id, name) {
    let cls = "status-default";

    switch (id) {
        case 1: cls = "status-pending"; break;
        case 2: cls = "status-approved"; break;
        case 3: cls = "status-rejected"; break;
        default: cls = "status-default"; break;
    }

    return `<span class="badge ${cls}">${name || "Unknown"}</span>`;
}

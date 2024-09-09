let db;
const request = indexedDB.open('financeDB', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('finances', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('month', 'month', { unique: false });
    objectStore.createIndex('year', 'year', { unique: false });
    objectStore.createIndex('type', 'type', { unique: false });
    objectStore.createIndex('description', 'description', { unique: false });
    objectStore.createIndex('amount', 'amount', { unique: false });
};

request.onsuccess = function(event) {
    db = event.target.result;
    displayFinances();
};

request.onerror = function(event) {
    console.error('Erro ao abrir o banco de dados:', event.target.errorCode);
};

document.getElementById('finance-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('finance-id').value;
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    const type = document.getElementById('type').value;
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    
    const transaction = db.transaction(['finances'], 'readwrite');
    const objectStore = transaction.objectStore('finances');
    const finance = { month, year, type, description, amount };
    
    if (id) {
        finance.id = Number(id);
        objectStore.put(finance);
    } else {
        objectStore.add(finance);
    }
    
    transaction.oncomplete = function() {
        displayFinances();
        document.getElementById('finance-form').reset();
        document.getElementById('finance-id').value = '';
    };
});

function displayFinances() {
    const financeList = document.getElementById('finance-list');
    financeList.innerHTML = '';
    
    const transaction = db.transaction(['finances'], 'readonly');
    const objectStore = transaction.objectStore('finances');
    
    let totalBalance = 0;
    
    objectStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const li = document.createElement('li');
            li.textContent = `${cursor.value.month}/${cursor.value.year} - ${cursor.value.type} - ${cursor.value.description}: R$ ${cursor.value.amount}`;
            
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.onclick = function() {
                editFinance(cursor.value.id);
            };
            li.appendChild(editButton);
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Excluir';
            deleteButton.onclick = function() {
                deleteFinance(cursor.value.id);
            };
            li.appendChild(deleteButton);
            
            financeList.appendChild(li);
            
            if (cursor.value.type === 'entrada') {
                totalBalance += cursor.value.amount;
            } else {
                totalBalance -= cursor.value.amount;
            }
            
            cursor.continue();
        } else {
            const balanceDisplay = document.createElement('p');
            balanceDisplay.textContent = `Saldo Total: R$ ${totalBalance.toFixed(2)}`;
            financeList.appendChild(balanceDisplay);
        }
    };
}

function editFinance(id) {
    const transaction = db.transaction(['finances'], 'readwrite');
    const objectStore = transaction.objectStore('finances');
    
    const request = objectStore.get(id);
    request.onsuccess = function(event) {
        const finance = event.target.result;
        
        document.getElementById('finance-id').value = finance.id;
        document.getElementById('month').value = finance.month;
        document.getElementById('year').value = finance.year;
        document.getElementById('type').value = finance.type;
        document.getElementById('description').value = finance.description;
        document.getElementById('amount').value = finance.amount;
    };
}

function deleteFinance(id) {
    const transaction = db.transaction(['finances'], 'readwrite');
    const objectStore = transaction.objectStore('finances');
    
    objectStore.delete(id);
    
    transaction.oncomplete = function() {
        displayFinances();
    };
}

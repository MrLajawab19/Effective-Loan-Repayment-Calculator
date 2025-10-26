// Global variables
let charts = {
    principalInterest: null,
    balance: null,
    comparison: null
};

let currentSchedule = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {
    // Prepayment type toggle
    document.querySelectorAll('input[name="prepaymentType"]').forEach(radio => {
        radio.addEventListener('change', togglePrepaymentOptions);
    });

    // Enter key to calculate
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculate();
            }
        });
    });
}

function togglePrepaymentOptions() {
    const type = document.querySelector('input[name="prepaymentType"]:checked').value;
    document.getElementById('onetimePrepayment').classList.toggle('hidden', type !== 'onetime');
    document.getElementById('systematicPrepayment').classList.toggle('hidden', type !== 'systematic');
}

function calculate() {
    // Get inputs
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const annualRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const tenureValue = parseFloat(document.getElementById('tenureValue').value) || 0;
    const tenureUnit = document.querySelector('input[name="tenureUnit"]:checked').value;
    
    // Validation
    if (loanAmount <= 0 || annualRate <= 0 || tenureValue <= 0) {
        alert('⚠️ Please fill in all required fields:\n\n• Loan Amount must be greater than 0\n• Interest Rate must be greater than 0\n• Loan Tenure must be greater than 0');
        return;
    }

    // Hide welcome panel and show output panel
    document.getElementById('welcomePanel').style.display = 'none';
    document.getElementById('outputPanel').style.display = 'flex';
    
    // Smooth scroll to results
    setTimeout(() => {
        document.getElementById('outputPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    // Convert to months
    const tenureMonths = tenureUnit === 'years' ? tenureValue * 12 : tenureValue;
    const monthlyRate = annualRate / 12 / 100;

    // Calculate original EMI
    const emiOriginal = calculateEMI(loanAmount, monthlyRate, tenureMonths);

    // Get prepayment details
    const prepaymentType = document.querySelector('input[name="prepaymentType"]:checked').value;
    const strategy = document.querySelector('input[name="prepaymentStrategy"]:checked').value;

    // Calculate amortization schedule
    let scheduleOriginal = calculateAmortization(loanAmount, monthlyRate, emiOriginal, tenureMonths, {});
    let scheduleWithPrepayment = scheduleOriginal;
    
    if (prepaymentType !== 'none') {
        const prepayments = getPrepayments(prepaymentType, tenureMonths);
        scheduleWithPrepayment = calculateAmortization(loanAmount, monthlyRate, emiOriginal, tenureMonths, prepayments, strategy);
    }

    currentSchedule = scheduleWithPrepayment;

    // Display results
    displayResults(emiOriginal, scheduleOriginal, scheduleWithPrepayment, prepaymentType !== 'none');
    
    // Update charts
    updateCharts(scheduleWithPrepayment, scheduleOriginal);
    
    // Update table
    updateAmortizationTable(scheduleWithPrepayment);
}

function calculateEMI(principal, monthlyRate, months) {
    if (monthlyRate === 0) return principal / months;
    return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
}

function getPrepayments(type, maxMonths) {
    const prepayments = {};
    
    if (type === 'onetime') {
        const amount = parseFloat(document.getElementById('onetimeAmount').value) || 0;
        const month = parseInt(document.getElementById('onetimeMonth').value) || 1;
        if (amount > 0 && month <= maxMonths) {
            prepayments[month] = amount;
        }
    } else if (type === 'systematic') {
        const amount = parseFloat(document.getElementById('systematicAmount').value) || 0;
        const frequency = document.querySelector('input[name="systematicFrequency"]:checked').value;
        const startMonth = parseInt(document.getElementById('systematicStart').value) || 1;
        
        if (amount > 0) {
            const step = frequency === 'monthly' ? 1 : 12;
            for (let month = startMonth; month <= maxMonths; month += step) {
                prepayments[month] = amount;
            }
        }
    }
    
    return prepayments;
}

function calculateAmortization(principal, monthlyRate, emi, maxMonths, prepayments, strategy = 'reduceTenure') {
    const schedule = [];
    let balance = principal;
    let month = 1;
    let currentEMI = emi;

    while (balance > 0.01 && month <= maxMonths * 3) {
        const interest = balance * monthlyRate;
        let principalPaid = currentEMI - interest;
        
        if (principalPaid > balance) {
            principalPaid = balance;
            currentEMI = principalPaid + interest;
        }

        const prepayment = prepayments[month] || 0;
        let actualPrepayment = Math.min(prepayment, balance - principalPaid);
        
        balance = balance - principalPaid - actualPrepayment;
        
        if (balance < 0) balance = 0;

        schedule.push({
            month: month,
            emi: currentEMI,
            principal: principalPaid,
            interest: interest,
            prepayment: actualPrepayment,
            balance: balance
        });

        // Recalculate EMI after prepayment if strategy is reduceEMI
        if (actualPrepayment > 0 && strategy === 'reduceEMI' && balance > 0) {
            const remainingMonths = maxMonths - month;
            if (remainingMonths > 0) {
                currentEMI = calculateEMI(balance, monthlyRate, remainingMonths);
            }
        }

        month++;
    }

    return schedule;
}

function displayResults(emiOriginal, scheduleOriginal, scheduleWithPrepayment, hasPrepayment) {
    const totalInterestOriginal = scheduleOriginal.reduce((sum, row) => sum + row.interest, 0);
    const totalInterestWithPrepayment = scheduleWithPrepayment.reduce((sum, row) => sum + row.interest, 0);
    const interestSaved = totalInterestOriginal - totalInterestWithPrepayment;
    const monthsSaved = scheduleOriginal.length - scheduleWithPrepayment.length;

    // EMI
    document.getElementById('emiOriginal').textContent = formatCurrency(emiOriginal);
    if (hasPrepayment) {
        const finalEMI = scheduleWithPrepayment[scheduleWithPrepayment.length - 1].emi;
        if (Math.abs(finalEMI - emiOriginal) > 1) {
            document.getElementById('emiAfter').textContent = `After: ${formatCurrency(finalEMI)}`;
        } else {
            document.getElementById('emiAfter').textContent = '';
        }
    } else {
        document.getElementById('emiAfter').textContent = '';
    }

    // Interest
    document.getElementById('totalInterest').textContent = formatCurrency(totalInterestOriginal);
    if (hasPrepayment && interestSaved > 0) {
        document.getElementById('interestSaved').textContent = `Saved: ${formatCurrency(interestSaved)}`;
    } else {
        document.getElementById('interestSaved').textContent = '';
    }

    // Duration
    document.getElementById('duration').textContent = `${scheduleOriginal.length} months`;
    if (hasPrepayment && monthsSaved > 0) {
        document.getElementById('durationSaved').textContent = `Saved: ${monthsSaved} months`;
    } else {
        document.getElementById('durationSaved').textContent = '';
    }
}

function updateCharts(schedule, scheduleOriginal) {
    updatePrincipalInterestChart(schedule);
    updateBalanceChart(schedule);
    updateComparisonChart(schedule, scheduleOriginal);
}

function updatePrincipalInterestChart(schedule) {
    const ctx = document.getElementById('principalInterestChart');
    
    if (charts.principalInterest) {
        charts.principalInterest.destroy();
    }

    // Sample data if too many months
    const sampledSchedule = sampleData(schedule, 50);
    
    const months = sampledSchedule.map(row => row.month);
    const principal = sampledSchedule.map(row => row.principal);
    const interest = sampledSchedule.map(row => row.interest);

    charts.principalInterest = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Principal',
                    data: principal,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Interest',
                    data: interest,
                    backgroundColor: 'rgba(255, 159, 64, 0.7)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Amount (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

function updateBalanceChart(schedule) {
    const ctx = document.getElementById('balanceChart');
    
    if (charts.balance) {
        charts.balance.destroy();
    }

    const sampledSchedule = sampleData(schedule, 100);
    const months = sampledSchedule.map(row => row.month);
    const balances = sampledSchedule.map(row => row.balance);

    charts.balance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Outstanding Balance',
                data: balances,
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Balance (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Balance: ₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

function updateComparisonChart(schedule, scheduleOriginal) {
    const ctx = document.getElementById('comparisonChart');
    
    if (charts.comparison) {
        charts.comparison.destroy();
    }

    const maxLength = Math.max(schedule.length, scheduleOriginal.length);
    const sampledOriginal = sampleData(scheduleOriginal, 100);
    const sampledPrepayment = sampleData(schedule, 100);
    
    charts.comparison = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sampledOriginal.map(r => r.month),
            datasets: [
                {
                    label: 'Original Loan',
                    data: sampledOriginal.map(r => r.balance),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'With Prepayment',
                    data: sampledPrepayment.map(r => r.balance),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Balance (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}

function updateAmortizationTable(schedule) {
    const tbody = document.getElementById('amortizationBody');
    tbody.innerHTML = '';

    // Limit table rows for performance
    const displaySchedule = schedule.length > 360 ? sampleData(schedule, 360) : schedule;

    displaySchedule.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.month}</td>
            <td>${formatCurrency(row.emi)}</td>
            <td>${formatCurrency(row.principal)}</td>
            <td>${formatCurrency(row.interest)}</td>
            <td>${row.prepayment > 0 ? formatCurrency(row.prepayment) : '-'}</td>
            <td>${formatCurrency(row.balance)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function exportToCSV() {
    const schedule = currentSchedule;
    if (!schedule || schedule.length === 0) {
        alert('No data to export');
        return;
    }

    let csv = 'Month,EMI,Principal,Interest,Prepayment,Balance\n';
    
    schedule.forEach(row => {
        csv += `${row.month},${row.emi.toFixed(2)},${row.principal.toFixed(2)},${row.interest.toFixed(2)},${row.prepayment.toFixed(2)},${row.balance.toFixed(2)}\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'loan_amortization_schedule.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatCurrency(value) {
    return '₹' + Math.round(value).toLocaleString('en-IN');
}

function sampleData(data, maxPoints) {
    if (data.length <= maxPoints) return data;
    
    const step = Math.ceil(data.length / maxPoints);
    const sampled = [];
    
    for (let i = 0; i < data.length; i += step) {
        sampled.push(data[i]);
    }
    
    // Always include the last point
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
        sampled.push(data[data.length - 1]);
    }
    
    return sampled;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Focus on first input
    setTimeout(() => {
        document.getElementById('loanAmount').focus();
    }, 500);
}

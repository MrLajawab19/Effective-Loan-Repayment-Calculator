// Global variables
let currentSchedule = [];
let autoCalculateTimeout = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {
    // Prepayment type toggle
    document.querySelectorAll('input[name="prepaymentType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            togglePrepaymentOptions();
            triggerAutoCalculate();
        });
    });

    // Auto-calculate on input changes
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', triggerAutoCalculate);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(autoCalculateTimeout);
                calculate();
            }
        });
    });

    // Auto-calculate on radio changes
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', triggerAutoCalculate);
    });
}

function triggerAutoCalculate() {
    // Debounce: wait 500ms after user stops typing before calculating
    clearTimeout(autoCalculateTimeout);
    
    // Show subtle loading indicator in output panel if it exists
    const outputPanel = document.getElementById('outputPanel');
    if (outputPanel && outputPanel.style.display !== 'none') {
        const indicator = document.getElementById('autoCalculateIndicator');
        if (!indicator) {
            const newIndicator = document.createElement('div');
            newIndicator.id = 'autoCalculateIndicator';
            newIndicator.style.cssText = 'text-align: center; color: #667eea; font-size: 0.9rem; padding: 10px; font-style: italic;';
            newIndicator.textContent = '⏳ Updating calculations...';
            outputPanel.insertBefore(newIndicator, outputPanel.firstChild);
        }
    }
    
    autoCalculateTimeout = setTimeout(() => {
        const loanAmount = document.getElementById('loanAmount').value;
        const interestRate = document.getElementById('interestRate').value;
        const tenureValue = document.getElementById('tenureValue').value;
        
        // Only auto-calculate if all required fields are filled
        if (loanAmount > 0 && interestRate > 0 && tenureValue > 0) {
            calculate();
            
            // Remove indicator after calculation
            setTimeout(() => {
                const indicator = document.getElementById('autoCalculateIndicator');
                if (indicator) indicator.remove();
            }, 1000);
        } else {
            // Remove indicator if validation fails
            const indicator = document.getElementById('autoCalculateIndicator');
            if (indicator) indicator.remove();
        }
    }, 500);
}

function togglePrepaymentOptions() {
    const type = document.querySelector('input[name="prepaymentType"]:checked').value;
    const onetimeDiv = document.getElementById('onetimePrepayment');
    const systematicDiv = document.getElementById('systematicPrepayment');
    
    // Reset both
    onetimeDiv.classList.toggle('hidden', type !== 'onetime');
    systematicDiv.classList.toggle('hidden', type !== 'systematic');
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
    
    // Show loading state on button
    const calculateBtn = document.querySelector('.calculate-btn');
    const originalText = calculateBtn.textContent;
    calculateBtn.textContent = '⏳ Calculating...';
    calculateBtn.disabled = true;
    
    // Remove auto-calculate indicator if it exists
    const autoIndicator = document.getElementById('autoCalculateIndicator');
    if (autoIndicator) autoIndicator.remove();
    
    // Use setTimeout to allow UI to update, then run calculations
    setTimeout(() => {
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
        
        // Update comparison display
        updateComparisonDisplay(scheduleOriginal, scheduleWithPrepayment, prepaymentType !== 'none');
        
        // Update table
        updateAmortizationTable(scheduleWithPrepayment);

        // Smooth scroll to results
        setTimeout(() => {
            document.getElementById('outputPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);

        // Restore button
        calculateBtn.textContent = originalText;
        calculateBtn.disabled = false;
    }, 50);
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

function updateComparisonDisplay(scheduleOriginal, scheduleWithPrepayment, hasPrepayment) {
    // Calculate totals
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const emiOriginal = scheduleOriginal[0].emi;
    
    const totalInterestOriginal = scheduleOriginal.reduce((sum, row) => sum + row.interest, 0);
    const totalInterestWithPrepayment = scheduleWithPrepayment.reduce((sum, row) => sum + row.interest, 0);
    
    const totalPrincipalOriginal = loanAmount;
    const totalPrincipalWithPrepayment = scheduleWithPrepayment.reduce((sum, row) => sum + row.principal, 0);
    
    const totalPaidOriginal = loanAmount + totalInterestOriginal;
    const totalPaidPrepayment = totalPrincipalWithPrepayment + totalInterestWithPrepayment;
    
    const durationOriginal = scheduleOriginal.length;
    const durationPrepayment = scheduleWithPrepayment.length;
    
    const emiPrepayment = scheduleWithPrepayment[0].emi;
    
    // Original plan - without prepayment
    document.getElementById('compareEmiOriginal').textContent = formatCurrency(emiOriginal);
    document.getElementById('compareInterestOriginal').textContent = formatCurrency(totalInterestOriginal);
    document.getElementById('compareDurationOriginal').textContent = `${durationOriginal} months`;
    document.getElementById('compareTotalOriginal').textContent = formatCurrency(totalPaidOriginal);
    
    // With prepayment plan
    document.getElementById('compareEmiPrepayment').textContent = formatCurrency(emiPrepayment);
    document.getElementById('compareInterestPrepayment').textContent = formatCurrency(totalInterestWithPrepayment);
    document.getElementById('compareDurationPrepayment').textContent = `${durationPrepayment} months`;
    document.getElementById('compareTotalPrepayment').textContent = formatCurrency(totalPaidPrepayment);
    
    if (hasPrepayment) {
        // Calculate differences and display change indicators
        const emiDiff = emiPrepayment - emiOriginal;
        const emiChangeEl = document.getElementById('compareEmiChange');
        if (Math.abs(emiDiff) > 1) {
            emiChangeEl.textContent = emiDiff < 0 ? `₹${Math.abs(Math.round(emiDiff)).toLocaleString('en-IN')} less` : `₹${Math.abs(Math.round(emiDiff)).toLocaleString('en-IN')} more`;
            emiChangeEl.className = emiDiff < 0 ? 'detail-change positive' : 'detail-change negative';
        } else {
            emiChangeEl.textContent = '';
            emiChangeEl.className = 'detail-change neutral';
        }
        
        const interestDiff = totalInterestOriginal - totalInterestWithPrepayment;
        const interestChangeEl = document.getElementById('compareInterestChange');
        interestChangeEl.textContent = `Save ₹${Math.round(interestDiff).toLocaleString('en-IN')}`;
        interestChangeEl.className = 'detail-change positive';
        
        const durationDiff = durationOriginal - durationPrepayment;
        const durationChangeEl = document.getElementById('compareDurationChange');
        if (durationDiff > 0) {
            durationChangeEl.textContent = `${durationDiff} months less`;
            durationChangeEl.className = 'detail-change positive';
        } else {
            durationChangeEl.textContent = '';
            durationChangeEl.className = 'detail-change neutral';
        }
        
        const totalDiff = totalPaidOriginal - totalPaidPrepayment;
        const totalChangeEl = document.getElementById('compareTotalChange');
        if (totalDiff > 0) {
            totalChangeEl.textContent = `Save ₹${Math.round(totalDiff).toLocaleString('en-IN')}`;
            totalChangeEl.className = 'detail-change positive';
        } else {
            totalChangeEl.textContent = '';
            totalChangeEl.className = 'detail-change neutral';
        }
        
        // Show savings summary
        document.getElementById('totalSavings').textContent = formatCurrency(interestDiff);
        document.getElementById('timeSavings').textContent = durationDiff > 0 ? `${durationDiff} months` : '0 months';
        document.getElementById('savingsSummary').style.display = 'block';
    } else {
        // Hide all change indicators
        ['compareEmiChange', 'compareInterestChange', 'compareDurationChange', 'compareTotalChange'].forEach(id => {
            const el = document.getElementById(id);
            el.textContent = '';
            el.className = 'detail-change';
        });
        document.getElementById('savingsSummary').style.display = 'none';
    }
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

# 💰 Loan EMI & Prepayment Calculator

A modern, responsive web application for calculating loan EMI and analyzing prepayment impact with interactive visualizations.

## 🌟 Features

### Input Options
- **Loan Amount**: Enter your loan principal amount in rupees
- **Annual Interest Rate**: Set the interest rate percentage
- **Loan Tenure**: Choose between years or months
- **Prepayment Types**:
  - **None**: Standard EMI calculation without prepayment
  - **One-Time Prepayment**: Make a single prepayment at a specific month
  - **Systematic Prepayment**: Regular monthly or yearly prepayments

### Prepayment Strategies
- **Reduce Tenure**: Keep EMI constant, reduce loan duration
- **Reduce EMI**: Keep tenure constant, reduce monthly payment

### Outputs & Visualizations

#### Key Metrics
1. **Monthly EMI**: Original and adjusted EMI after prepayment
2. **Total Interest**: Interest with and without prepayment, showing savings
3. **Loan Duration**: Original duration and months saved

#### Interactive Charts
1. **Principal vs Interest Payment**: Stacked bar chart showing monthly breakdown
2. **Outstanding Loan Balance**: Line chart tracking remaining balance over time
3. **Comparison Chart**: Side-by-side comparison of original vs prepayment scenarios

#### Amortization Table
- Detailed month-by-month breakdown
- Shows EMI, principal, interest, prepayment, and balance
- **Export to CSV**: Download the complete schedule

## 🚀 How to Use

### Running the Application

1. **Using Python HTTP Server** (Recommended):
   ```bash
   cd EffectiveLoanRepaymentCalculator
   python -m http.server 8000
   ```
   Open `http://localhost:8000` in your browser

2. **Direct File Access**:
   Simply open `index.html` in any modern web browser

### Using the Calculator

1. **Enter Loan Details**:
   - Input your loan amount (e.g., ₹1,000,000)
   - Set annual interest rate (e.g., 8.5%)
   - Choose tenure and unit (e.g., 20 years)

2. **Configure Prepayment** (Optional):
   - Select prepayment type: None, One-Time, or Systematic
   - For one-time: Enter amount and month
   - For systematic: Enter amount, frequency (monthly/yearly), and start month

3. **Choose Strategy**:
   - Reduce Tenure: Pay off loan faster
   - Reduce EMI: Lower monthly payments

4. **View Results**:
   - Results update in real-time as you change inputs
   - Scroll down to see detailed charts and amortization schedule
   - Click "Export to CSV" to download the schedule

## 📊 Example Scenarios

### Scenario 1: Home Loan with One-Time Bonus Prepayment
- Loan: ₹50,00,000
- Interest: 8.5% p.a.
- Tenure: 20 years
- Prepayment: ₹5,00,000 at month 24
- Strategy: Reduce Tenure
- **Result**: Save ~4 years and ₹8-10 lakhs in interest

### Scenario 2: Personal Loan with Systematic Prepayment
- Loan: ₹5,00,000
- Interest: 12% p.a.
- Tenure: 5 years
- Prepayment: ₹5,000 every month from month 1
- Strategy: Reduce Tenure
- **Result**: Pay off in ~3.5 years, save significant interest

## 🎨 Features Highlights

### User Experience
- ✅ Real-time calculation updates
- ✅ Input validation (positive numbers only)
- ✅ Clean, professional design
- ✅ Color-coded visualizations
- ✅ Interactive chart tooltips
- ✅ Responsive design (mobile & desktop)

### Technical Features
- ✅ Pure JavaScript (no build tools required)
- ✅ Chart.js for beautiful visualizations
- ✅ Accurate EMI calculations using standard formula
- ✅ Handles complex prepayment scenarios
- ✅ CSV export functionality
- ✅ Performance optimized (data sampling for large datasets)

## 📱 Responsive Design

The calculator is fully responsive and works seamlessly on:
- Desktop computers (1920px+)
- Laptops (1024px - 1920px)
- Tablets (768px - 1024px)
- Mobile phones (320px - 768px)

## 🧮 Calculation Formulas

### EMI Formula
```
EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
```
Where:
- P = Principal loan amount
- r = Monthly interest rate
- n = Number of months

### Prepayment Impact
- **Reduce Tenure**: EMI remains constant, outstanding balance reduced, recalculate remaining months
- **Reduce EMI**: Recalculate EMI for remaining tenure after each prepayment

## 🔧 Technical Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Grid & Flexbox
- **JavaScript (ES6+)**: Vanilla JS for calculations
- **Chart.js**: Data visualization library

## 📂 Project Structure

```
EffectiveLoanRepaymentCalculator/
│
├── index.html          # Main HTML structure
├── styles.css          # All styling and responsive design
├── calculator.js       # Calculation logic and chart rendering
└── README.md          # Documentation (this file)
```

## 🎯 Key Benefits

1. **Informed Decision Making**: Visualize the impact of prepayments before committing
2. **Financial Planning**: Compare different prepayment strategies
3. **Transparency**: See exactly where your money goes each month
4. **Easy Sharing**: Export amortization schedule as CSV for records
5. **No Installation**: Works directly in any modern browser

## 🌐 Browser Compatibility

Works on all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 💡 Tips for Best Results

1. **Realistic Interest Rates**: Use your actual loan interest rate for accurate calculations
2. **Consider Prepayment Penalties**: Some banks charge fees for prepayment - factor this in
3. **Emergency Fund First**: Ensure you have 6 months of expenses before aggressive prepayments
4. **Compare Strategies**: Try both "Reduce Tenure" and "Reduce EMI" to see what works best
5. **Regular Reviews**: Update the calculator as your financial situation changes

## 📝 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Feel free to fork, modify, and enhance this calculator. Suggestions and improvements are welcome!

## 📞 Support

For issues or questions, please check the code comments or create an issue in the repository.

---

**Made with ❤️ for better financial planning**

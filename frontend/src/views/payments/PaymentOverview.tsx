import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Button from 'reactstrap/lib/Button';
import IziviContent from '../../layout/IziviContent';
import { OverviewTable } from '../../layout/OverviewTable';
import { ExpenseSheetStore } from '../../stores/expenseSheetStore';
import { MainStore } from '../../stores/mainStore';
import { PaymentStore } from '../../stores/paymentStore';
import { Column, ExpenseSheet, Payment } from '../../types';

interface Props {
  mainStore?: MainStore;
  paymentStore?: PaymentStore;
  expenseSheetStore?: ExpenseSheetStore;
}

interface State {
  loading: boolean;
}

@inject('mainStore', 'paymentStore', 'expenseSheetStore')
@observer
export class PaymentOverview extends React.Component<Props, State> {
  paymentColumns: Array<Column<Payment>>;
  reportSheetColumns: Array<Column<ExpenseSheet>>;

  constructor(props: Props) {
    super(props);

    this.paymentColumns = [
      {
        id: 'created_at',
        label: 'Datum',
        format: (p: Payment) => this.props.mainStore!.formatDate(p.created_at),
      },
      {
        id: 'amount',
        label: 'Betrag',
        format: (p: Payment) => this.props.mainStore!.formatCurrency(p.amount),
      },
    ];

    this.reportSheetColumns = [
      {
        id: 'zdp',
        label: 'ZDP',
        format: (r: ExpenseSheet) => (r.user ? r.user.zdp : ''),
      },
      {
        id: 'full_name',
        label: 'Name',
        format: (r: ExpenseSheet) => (r.user ? `${r.user.first_name} ${r.user.last_name}` : ''),
      },
      {
        id: 'iban',
        label: 'IBAN',
        format: (r: ExpenseSheet) => (r.user ? r.user.bank_iban : ''),
      },
      {
        id: 'total_costs',
        label: 'Betrag',
        format: (r: ExpenseSheet) => this.props.mainStore!.formatCurrency(r.total_costs),
      },
      {
        id: 'notices',
        label: 'Bemerkungen',
        format: (r: ExpenseSheet) => (
          <>
            {r.user && (r.user.address === '' || r.user.city === '' || !r.user.zip) && (
              <>
                <p>Adresse unvollständig!</p>
                <br />
              </>
            )}
            {!this.props.mainStore!.validateIBAN(r.user ? r.user.bank_iban : '') && (
              <>
                <p>IBAN hat ein ungültiges Format!</p>
                <br />
              </>
            )}
          </>
        ),
      },
    ];

    this.state = {
      loading: true,
    };
  }

  componentDidMount(): void {
    Promise.all([this.props.paymentStore!.fetchAll(), this.props.expenseSheetStore!.fetchToBePaidAll()]).then(() => {
      this.setState({ loading: false });
    });
  }

  render() {
    return (
      <IziviContent card loading={this.state.loading} title={'Auszahlungen'}>
        {this.props.expenseSheetStore!.toBePaidExpenseSheets.length > 0 ? (
          <>
            <OverviewTable
              columns={this.reportSheetColumns}
              data={this.props.expenseSheetStore!.toBePaidExpenseSheets}
              renderActions={(r: ExpenseSheet) => <Link to={'/expense_sheets/' + r.id}>Spesenblatt</Link>}
            />
            <Button
              color={'primary'}
              href={this.props.mainStore!.apiURL('payments/execute')}
              tag={'a'}
              target={'_blank'}
            >
              Zahlungsdatei generieren
            </Button>
          </>
        ) : (
          'Keine Spesen zur Auszahlung bereit.'
        )}
        <br />
        <br />
        <h1>Archiv</h1> <br />
        <OverviewTable
          columns={this.paymentColumns}
          data={this.props.paymentStore!.payments}
          renderActions={(p: Payment) => (
            <>
              <Link to={'/payments/' + p.id}>Details</Link>
            </>
          )}
        />
      </IziviContent>
    );
  }
}

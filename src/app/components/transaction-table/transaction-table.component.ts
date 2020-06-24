import { Component, OnInit, Input } from '@angular/core';
import { BlockchainService } from 'src/app/services/blockchain.service';

@Component({
  selector: 'app-transaction-table',
  templateUrl: './transaction-table.component.html',
  styleUrls: ['./transaction-table.component.scss']
})


export class TransactionTableComponent implements OnInit {

  @Input()
  public transactions = [];

  constructor(public blockchainService: BlockchainService) { }


  ngOnInit(): void {
  }

}

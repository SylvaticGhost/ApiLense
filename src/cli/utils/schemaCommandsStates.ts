import { StateMachine } from '../../infrastructure/stateMachine.ts';

export class EndpointListDisplayStateMachine extends StateMachine<
  'SELECT' | 'ACTIONS' | 'BACK' | 'CLOSE'
> {
  constructor() {
    super('SELECT');
  }

  continue(): boolean {
    return this.current !== 'CLOSE' && this.current !== 'BACK';
  }
}

export class SchemaListDisplayStateMachine extends StateMachine<
  'LIST' | 'DETAILS' | 'ENDPOINTS' | 'CLOSE'
> {
  constructor() {
    super('LIST');
  }

  continue(): boolean {
    return this.current !== 'CLOSE';
  }
}

import { expect } from 'chai';
import { Builder } from '../../src/managers/builder';
import { StateConstant } from '../../src/constants/state';
import { PublishValidator } from '../../src/handlers/publishValidator';

describe('Check PublishValidator', function () {
  it('should invoke properly', async function () {
    const validator = new PublishValidator();
    const nextStep = await validator.invoke(
      StateConstant.ValidatePublishedContent,
      Builder.GetDefaultActionParameters(),
      Builder.GetDefaultActionContext()
    );
    expect(nextStep).to.equal(StateConstant.Succeeded);
  });
});
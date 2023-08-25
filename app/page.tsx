"use client";
import { Row, Col, Card, Form, InputNumber, Select, Button, Modal, Input } from "antd";
import { useForm } from "antd/lib/form/Form";
import { useState } from "react";
const characterData = require(`@constants/characters.json`);
const dishesData = require(`@constants/dishes.json`);
const ingredientsData = require(`@constants/ingredients.json`);
const drinksData = require(`@constants/drinks.json`);
const foodTagsData = require(`@constants/foodTags.json`);
const drinkTagsData = require(`@constants/drinkTags.json`);

const Home = () => {
  const [form] = useForm();
  const [resultsForm] = useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [characterSelected, setCharacterSelected] = useState('');
  const [ingredientScore, setIngredientScore] = useState(0);
  const [drinkScore, setDrinkScore] = useState('0');

  const onFinish = (values: any) => {
    // load data from src/constants/characters.json
    const character = values.character;
    const requiredTag = values.requiredTag;
    const requiredDrinkTag = values.requiredDrinkTag;
    const currentBudget = values.currentBudget;
    let remainingBudget = currentBudget;

    // find character
    const characterFound = characterData.find(
      (characterItem: any) => characterItem.name === character
    );

    // find which dish to make based on character tags and dishes tags
    const characterTags = characterFound.foodPreferences;
    const characterDrinkTags = characterFound.drinkPreferences;
    let dish = dishesData.find((dish: any) => {
      const dishTags = dish.tags;
      return dishTags.some((tag: string) => characterTags.includes(tag) && tag === requiredTag && dish.price <= currentBudget);
    });

    // if no dishes are found, default to the first dish
    if (!dish) {
      dish = dishesData[0];
      remainingBudget = currentBudget - dish.price;
    }

    console.log('dishes', dish)

    // calculate the amount of tags that satisfy the character based on current dishes
    const dishesTags = dish.tags;
    const dishesIncompatibleTags = dish.incompatibleTags;
    const dishIngredients = dish.ingredients;
    const dishCookware = dish.cookware;
    const dishesTagsFlat = dishesTags.flat();
    // compare dishesTagsFlat with characterTags
    const matchCount = characterTags.filter((tag: string) => dishesTagsFlat.includes(tag)).length;

    console.log('dishesTagsFlat', dishesTagsFlat)

    // if the tags are less then 3, then we need to add ingredients to fit the character
    let ingredients = [];
    // find out what tags are missing from the character and add them to the ingredients
    if (matchCount < 3) {
      const exisitingTags = characterTags.filter((tag: string) => dishesTagsFlat.includes(tag));
      console.log('exisitingTags', exisitingTags);
      const missingTags = characterTags.filter((tag: string) => !dishesTagsFlat.includes(tag));
      console.log('missingTags', missingTags);
      let remainingTagsCount = 3 - exisitingTags.length;
      console.log('remainingTagsCount', remainingTagsCount)
      // find ingredients that match the missing tags
      for (const missingTag of missingTags) {
        if (remainingTagsCount === 0) {
          break;
        }
        // find ingredients that match the missing tag
        const ingredientsFound = ingredientsData.filter((ingredient: any) => {
          const ingredientTags = ingredient.tags;
          // return ingredientTags that includes the missing tag and ingredientTags is not in the dishes incompatible tags
          return ingredientTags.includes(missingTag) && !(dishesIncompatibleTags || []).includes(ingredientTags);
        });
        console.log('ingredientsFound', ingredientsFound);
        if (ingredientsFound.length === 0) {
          continue;
        }
        remainingTagsCount -= 1;
        // add the first ingredient to the ingredients list
        ingredients.push(ingredientsFound[0]);
      }
    }
    console.log('ingredients score: ', characterTags.filter((tag: string) => dishesTagsFlat.includes(tag)).length + ingredients.length);
    setIngredientScore(characterTags.filter((tag: string) => dishesTagsFlat.includes(tag)).length + ingredients.length);

    // find drinks that match the character with required drink tag
    const drinks = drinksData.filter((drink: any) => {
      const drinkTags = drink.tags;

      // make it so the drink matches the required tag as well as match at least 2 drink tags of the character
      // if no drinks are found with 2 tags, then just match the required tag
      const drinks = drinkTags.some((tag: string) => characterDrinkTags.includes(tag) && tag === requiredDrinkTag) && (drinkTags.filter((tag: string) => characterDrinkTags.includes(tag)).length >= 2 || drinkTags.some((tag: string) => characterDrinkTags.includes(tag) && tag === requiredDrinkTag));
      return drinks;
    });

    // sort drinks by number of tags that match the character
    drinks.sort((a: any, b: any) => {
      const aDrinkTags = a.tags;
      const bDrinkTags = b.tags;
      const aDrinkTagsMatch = aDrinkTags.filter((tag: string) => characterDrinkTags.includes(tag)).length;
      const bDrinkTagsMatch = bDrinkTags.filter((tag: string) => characterDrinkTags.includes(tag)).length;
      return bDrinkTagsMatch - aDrinkTagsMatch;
    });

    console.log('drinks score: ', drinks.map((drink: any) => {
      const drinkTags = drink.tags;
      return drinkTags.filter((tag: string) => characterDrinkTags.includes(tag)).length;
    }).join(', '));
    setDrinkScore(drinks.map((drink: any) => {
      const drinkTags = drink.tags;
      return drinkTags.filter((tag: string) => characterDrinkTags.includes(tag)).length;
    }).join(', '));
    
    console.log('drinks', drinks);


    console.log('ingredients', ingredients)
    const extraIngredients = ingredients.map((ingredient: any) => ingredient.name);

    // amend to results
    const results = {
      dishName: dish.name,
      dishCookware,
      ingredients: [
        ...dishIngredients, ...extraIngredients
      ],
      drinks
    };

    resultsForm.setFieldValue('dishName', dish.name);
    resultsForm.setFieldValue('dishCookware', dishCookware);
    resultsForm.setFieldValue('ingredients', results.ingredients.join(', '));
    resultsForm.setFieldValue('drinks', results.drinks.map((drink: any) => drink.name).join(', '));
    setModalOpen(true);

    console.log(results);
  };

  return (
    <div className="px-5 h-full">
      <Row justify="center">
        <Col md={12}>
          <Card>
            <h3 className="text-h3 mt-0 mb-5">Calculator</h3>
            <Form
              layout="vertical"
              form={form}
              onFinish={onFinish}
            >
              <Form.Item name="character" label="Character">
                <Select onChange={(value) => {
                  setCharacterSelected(value);
                  form.setFieldValue('requiredTag', '');
                  form.setFieldValue('requiredDrinkTag', '');
                  form.setFieldValue('currentBudget', 0);
                }}>
                  {characterData.map((character: any) => (
                    <Select.Option key={character.name} value={character.name}>{character.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="requiredTag" label="Required Dish Tag">
                <Select>
                  {form.getFieldValue('character') && characterSelected ?
                  // if character is selected, then filter the food tags based on the character's food preferences
                    foodTagsData.filter((tag: any) => characterData.find((character: any) => character.name === form.getFieldValue('character'))?.foodPreferences.includes(tag)).map((tag: any) => (
                      <Select.Option key={tag} value={tag}>{tag}</Select.Option>
                    ))
                    : foodTagsData.map((tag: any) => (
                      <Select.Option key={tag} value={tag}>{tag}</Select.Option>
                    ))
                  }
                </Select>
              </Form.Item>

              <Form.Item name="requiredDrinkTag" label="Required Drink Tag">
                <Select >
                  {form.getFieldValue('character') && characterSelected ?
                  // if character is selected, then filter the drink tags based on the character's drink preferences
                    drinkTagsData.filter((tag: any) => characterData.find((character: any) => character.name === form.getFieldValue('character'))?.drinkPreferences.includes(tag)).map((tag: any) => (
                      <Select.Option key={tag} value={tag}>{tag}</Select.Option>
                    ))
                    : drinkTagsData.map((tag: any) => (
                      <Select.Option key={tag} value={tag}>{tag}</Select.Option>
                    ))
                  }
                </Select>
              </Form.Item>

              <Form.Item name="currentBudget" label="Current Budget">
                <InputNumber style={{ width: '100%' }} addonAfter="¥" />
              </Form.Item>

              <Button
                htmlType="submit"
                type="primary"
              >
                Calculate
              </Button>

              <Modal
                open={modalOpen}
                title="Results"
                onCancel={() => setModalOpen(false)}
                onOk={() => {
                  setModalOpen(false)
                  resultsForm.resetFields();
                }}
              >
                <Form
                  layout="vertical"
                  form={resultsForm}
                >
                  <Form.Item name="dishName" label="Dish Name">
                    <Input />
                  </Form.Item>

                  <Form.Item name="dishCookware" label="Cookware">
                    <Input />
                  </Form.Item>

                  <Form.Item name="ingredients" label={`Ingredients (${ingredientScore} score)`}>
                    <Input.TextArea />
                  </Form.Item>

                  <Form.Item name="drinks" label={`Drinks (${drinkScore} score)`}>
                    <Input.TextArea />
                  </Form.Item>
                </Form>
              </Modal>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Home;

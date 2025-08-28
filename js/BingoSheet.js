$(function (){
    console.log('BingoSheet.js');

    // 画像ファイルのリスト（imgフォルダ内の画像ファイル名を統一）
    // 共通画像群（200枚）- すべてのセットで使用
    const commonImages = Array.from({length: 200}, (_, i) => `img_common_${i}.png`);

    // 各セット特有の画像
    const set2UniqueImages = Array.from({length: 28}, (_, i) => `img2_unique_${i}.png`);  // 228 - 200 = 28枚
    const set3UniqueImages = Array.from({length: 62}, (_, i) => `img3_unique_${i}.png`);  // 262 - 200 = 62枚
    const set4UniqueImages = Array.from({length: 63}, (_, i) => `img4_unique_${i}.png`);  // 263 - 200 = 63枚
    const set5UniqueImages = Array.from({length: 96}, (_, i) => `img5_unique_${i}.png`);  // 296 - 200 = 96枚

    // 使用する画像ファイル配列を選択（デフォルトはセット2）
    let currentImageFiles = [...commonImages, ...set2UniqueImages];

    // 画像配列を選択する関数
    function selectImageArray(setNumber) {
        switch(setNumber) {
            case '2':
                currentImageFiles = [...commonImages, ...set2UniqueImages];
                break;
            case '3':
                currentImageFiles = [...commonImages, ...set3UniqueImages];
                break;
            case '4':
                currentImageFiles = [...commonImages, ...set4UniqueImages];
                break;
            case '5':
                currentImageFiles = [...commonImages, ...set5UniqueImages];
                break;
            default:
                currentImageFiles = [...commonImages, ...set2UniqueImages];
        }
        console.log(`画像セット${setNumber}を選択しました (共通: ${commonImages.length}枚 + セット固有: ${currentImageFiles.length - commonImages.length}枚 = 合計: ${currentImageFiles.length}枚)`);

        // 画像ファイルの存在確認を実行
        validateImageFiles();
    }

    // 画像配列選択プルダウンのイベントハンドラー
    $('#image-array-select').on('change', function() {
        const selectedSet = $(this).val();
        selectImageArray(selectedSet);
    });

    // 画像ファイルの存在確認関数
    function validateImageFiles() {
        const validImages = [];
        const missingImages = [];

        // 画像ファイルの存在確認（非同期で処理）
        const checkImage = (filename) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    validImages.push(filename);
                    resolve(true);
                };
                img.onerror = () => {
                    missingImages.push(filename);
                    console.warn(`画像ファイルが見つかりません: ${filename}`);
                    resolve(false);
                };
                img.src = `./img/${filename}`;
            });
        };

        // すべての画像を並行してチェック
        const checkPromises = currentImageFiles.map(checkImage);

        Promise.all(checkPromises).then(() => {
            console.log(`有効な画像: ${validImages.length}枚, 見つからない画像: ${missingImages.length}枚`);

            // 有効な画像のみで配列を更新
            if (validImages.length > 0) {
                currentImageFiles = validImages;
            } else {
                console.error('有効な画像ファイルが見つかりません');
                alert('画像ファイルが見つかりません。imgフォルダを確認してください。');
            }
        });
    }

    // 堅牢な入力値検証関数
    function validateInput(inputId, min, max) {
        const value = $(`#${inputId}`).val();
        const numValue = parseInt(value);

        if (isNaN(numValue) || numValue < min || numValue > max) {
            return null;
        }
        return numValue;
    }

    // ビンゴシートのサイズ
    const BINGO_SIZE = 5;
    const TOTAL_CELLS = BINGO_SIZE * BINGO_SIZE - 1; // FREEマスを除く

    // 完成済みのBINGOラインを記録
    let completedBingoLines = {
        rows: new Set(),
        cols: new Set(),
        diagonals: new Set() // 0: 左上から右下, 1: 右上から左下
    };

    // 生成ボタンのクリックイベント
    $('#generate-btn').on('click', function() {
        generateBingoSheet();
    });

    // すべて解除ボタンのクリックイベント
    $('#clear-all-btn').on('click', function() {
        clearAllChoices();
    });

    // ランダム解除ボタンのクリックイベント
    $('#random-clear-btn').on('click', function() {
        const count = validateInput('random-clear-count', 1, 20);
        if (count !== null) {
            randomClearChoices(count);
        } else {
            alert('1から20の範囲で有効な数値を入力してください');
        }
    });

    // ランダム選択ボタンのクリックイベント
    $('#random-select-btn').on('click', function() {
        const count = validateInput('random-select-count', 1, 20);
        if (count !== null) {
            randomSelectChoices(count);
        } else {
            alert('1から20の範囲で有効な数値を入力してください');
        }
    });

    // ビンゴシート生成関数
    function generateBingoSheet() {
        // 既存の画像をクリア（FREEマス以外）
        $('.bingo-cell:not(.free-cell)').empty();

        // 選択状態をクリア
        $('.bingo-cell:not(.free-cell)').removeAttr('data-choice');

        // 選択肢ツールチップを再追加
        $('.bingo-cell:not(.free-cell)').each(function() {
            const tooltip = $(`
                <div class="choice-tooltip">
                    <div class="choice-option select">選択</div>
                    <div class="choice-option unselect">解除</div>
                </div>
            `);
            $(this).append(tooltip);
        });

        // 画像ファイルをシャッフル
        const shuffledImages = shuffleArray([...currentImageFiles]);

        // 必要な数の画像を選択
        const selectedImages = shuffledImages.slice(0, TOTAL_CELLS);

        // 各マスに画像を配置
        let imageIndex = 0;
        $('.bingo-cell:not(.free-cell)').each(function() {
            if (imageIndex < selectedImages.length) {
                const img = $('<img>', {
                    src: `./img/${selectedImages[imageIndex]}`,
                    alt: `Bingo Image ${imageIndex + 1}`,
                    title: selectedImages[imageIndex]
                });

                // 画像読み込みエラー時の処理
                img.on('error', function() {
                    $(this).replaceWith(`<div class="image-placeholder">${selectedImages[imageIndex]}</div>`);
                });

                $(this).append(img);
                imageIndex++;
            }
        });

        console.log('ビンゴシートが生成されました');
    }

    // 配列をシャッフルする関数（Fisher-Yatesアルゴリズム）
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // すべての選択状態を一斉に解除する関数
    function clearAllChoices() {
        // すべてのマスから選択状態を削除
        $('.bingo-cell:not(.free-cell)').removeAttr('data-choice');

        console.log('すべての選択状態が解除されました');
    }

    // ランダムで指定した数のマスを選択解除する関数
    function randomClearChoices(count) {
        // 現在選択されているマスを取得
        const selectedCells = $('.bingo-cell:not(.free-cell)[data-choice]');

        if (selectedCells.length === 0) {
            alert('選択されているマスがありません');
            return;
        }

        // 選択されているマスの数を超える場合は調整
        const actualCount = Math.min(count, selectedCells.length);

        // ランダムに選択されたマスを配列に変換
        const selectedCellsArray = selectedCells.toArray();

        // Fisher-Yatesアルゴリズムでシャッフル
        for (let i = selectedCellsArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [selectedCellsArray[i], selectedCellsArray[j]] = [selectedCellsArray[j], selectedCellsArray[i]];
        }

        // 指定された数のマスを選択解除
        for (let i = 0; i < actualCount; i++) {
            $(selectedCellsArray[i]).removeAttr('data-choice');
        }

        console.log(`${actualCount}個のマスの選択がランダムに解除されました`);
    }

    // ランダムで指定した数のマスを選択する関数
    function randomSelectChoices(count) {
        // 現在選択されていないマスを取得（FREEマス以外）
        const unselectedCells = $('.bingo-cell:not(.free-cell):not([data-choice])');

        if (unselectedCells.length === 0) {
            alert('選択可能なマスがありません');
            return;
        }

        // 選択可能なマスの数を超える場合は調整
        const actualCount = Math.min(count, unselectedCells.length);

        // 選択可能なマスを配列に変換
        const unselectedCellsArray = unselectedCells.toArray();

        // Fisher-Yatesアルゴリズムでシャッフル
        for (let i = unselectedCellsArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [unselectedCellsArray[i], unselectedCellsArray[j]] = [unselectedCellsArray[j], unselectedCellsArray[i]];
        }

        // 指定された数のマスを選択状態にする
        for (let i = 0; i < actualCount; i++) {
            $(unselectedCellsArray[i]).attr('data-choice', 'select');
        }

        console.log(`${actualCount}個のマスがランダムに選択されました`);

        // ランダム選択後にビンゴ判定を実行
        checkBingo();
    }

    // ビンゴ判定関数
    function checkBingo() {
        const bingoSize = 5;
        let bingoLines = 0;

        // 行のチェック
        for (let row = 0; row < bingoSize; row++) {
            // すでに完成済みの行はスキップ
            if (completedBingoLines.rows.has(row)) continue;

            let rowCount = 0;
            let hasFreeCell = false;

            for (let col = 0; col < bingoSize; col++) {
                const cell = $(`.bingo-cell[data-row="${row}"][data-col="${col}"]`);
                if (cell.hasClass('free-cell')) {
                    hasFreeCell = true; // この行にFREEマスがある
                } else if (cell.attr('data-choice') === 'select') {
                    rowCount++;
                }
            }

            // FREEマスがある場合は4つ、ない場合は5つでBINGO達成
            const requiredCount = hasFreeCell ? 4 : 5;
            if (rowCount >= requiredCount) {
                bingoLines = 1; // 1ラインで終了
                // 完成した行を記録
                completedBingoLines.rows.add(row);
                break;
            }
        }

        // 1ライン達成していない場合のみ列と対角線をチェック
        if (bingoLines === 0) {
            // 列のチェック
            for (let col = 0; col < bingoSize; col++) {
                // すでに完成済みの列はスキップ
                if (completedBingoLines.cols.has(col)) continue;

                let colCount = 0;
                let hasFreeCell = false;

                for (let row = 0; row < bingoSize; row++) {
                    const cell = $(`.bingo-cell[data-row="${row}"][data-col="${col}"]`);
                    if (cell.hasClass('free-cell')) {
                        hasFreeCell = true; // この列にFREEマスがある
                    } else if (cell.attr('data-choice') === 'select') {
                        colCount++;
                    }
                }

                // FREEマスがある場合は4つ、ない場合は5つでBINGO達成
                const requiredCount = hasFreeCell ? 4 : 5;
                if (colCount >= requiredCount) {
                    bingoLines = 1; // 1ラインで終了
                    // 完成した列を記録
                    completedBingoLines.cols.add(col);
                    break;
                }
            }
        }

        // 1ライン達成していない場合のみ対角線をチェック
        if (bingoLines === 0) {
            // 対角線のチェック（左上から右下）
            if (!completedBingoLines.diagonals.has(0)) {
                let diagonal1Count = 0;
                let hasFreeCell = false;

                for (let i = 0; i < bingoSize; i++) {
                    const cell = $(`.bingo-cell[data-row="${i}"][data-col="${i}"]`);
                    if (cell.hasClass('free-cell')) {
                        hasFreeCell = true; // この対角線にFREEマスがある
                    } else if (cell.attr('data-choice') === 'select') {
                        diagonal1Count++;
                    }
                }

                // FREEマスがある場合は4つ、ない場合は5つでBINGO達成
                const requiredCount = hasFreeCell ? 4 : 5;
                if (diagonal1Count >= requiredCount) {
                    bingoLines = 1; // 1ラインで終了
                    // 完成した対角線を記録
                    completedBingoLines.diagonals.add(0);
                }
            }
        }

        // 1ライン達成していない場合のみ2番目の対角線をチェック
        if (bingoLines === 0) {
            // 対角線のチェック（右上から左下）
            if (!completedBingoLines.diagonals.has(1)) {
                let diagonal2Count = 0;
                let hasFreeCell = false;

                for (let i = 0; i < bingoSize; i++) {
                    const cell = $(`.bingo-cell[data-row="${i}"][data-col="${4-i}"]`);
                    if (cell.hasClass('free-cell')) {
                        hasFreeCell = true; // この対角線にFREEマスがある
                    } else if (cell.attr('data-choice') === 'select') {
                        diagonal2Count++;
                    }
                }

                // FREEマスがある場合は4つ、ない場合は5つでBINGO達成
                const requiredCount = hasFreeCell ? 4 : 5;
                if (diagonal2Count >= requiredCount) {
                    bingoLines = 1; // 1ラインで終了
                    // 完成した対角線を記録
                    completedBingoLines.diagonals.add(1);
                }
            }
        }

        // ビンゴラインが1つある場合、ポップアップを表示
        if (bingoLines > 0) {
            showBingoPopup();
        }
    }

    // ビンゴポップアップを表示
    function showBingoPopup() {
        const popup = $('#bingo-popup');
        const bingoText = popup.find('.bingo-text');
        const subtitle = popup.find('.bingo-subtitle');

        // FREEマスがあるので4つでBINGO達成
        bingoText.text('BINGO!');
        popup.addClass('show');
    }

    // ゲームを続ける機能
    function continueGame() {
        // ポップアップを非表示
        hideBingoPopup();

        console.log('ゲームを続行します');
    }

    // ゲームリセット機能
    function resetGame() {
        // ポップアップを非表示
        hideBingoPopup();

        // すべての選択状態をクリア
        clearAllChoices();

        // 完成済みのBINGOライン記録をクリア
        completedBingoLines.rows.clear();
        completedBingoLines.cols.clear();
        completedBingoLines.diagonals.clear();

        // ビンゴシートを再生成
        generateBingoSheet();

        console.log('ゲームがリセットされました');
    }

    // ビンゴポップアップを非表示
    function hideBingoPopup() {
        $('#bingo-popup').removeClass('show');
    }

    // 初期化時にビンゴシートを生成
    generateBingoSheet();

    // 選択肢のクリックイベント
    $(document).on('click', '.choice-option', function(e) {
        e.stopPropagation();
        const cell = $(this).closest('.bingo-cell');

        // クラスから選択状態を判定（テキストではなくクラス名で統一）
        const choiceKey = $(this).hasClass('select') ? 'select' : 'unselect';

        // 選択状態を保存
        cell.attr('data-choice', choiceKey);

        console.log(`マス (${cell.data('row')}, ${cell.data('col')}) で ${choiceKey} が選択されました`);

        // ビンゴ判定を実行（1ラインで終了）
        checkBingo();
    });

    // 「もう一度遊ぶ」ボタンのクリックイベント
    $('#play-again-btn').on('click', function() {
        resetGame();
    });

    // 「続ける」ボタンのクリックイベント
    $('#continue-btn').on('click', function() {
        continueGame();
    });

});